import json
import os
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Attr

# Initialize AWS clients at module level for connection reuse
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["SUBSCRIBERS_TABLE_NAME"])
ses_client = boto3.client("ses", region_name="us-east-2")
sender_email = os.environ["SES_SENDER_EMAIL"]
sender_name = os.environ["SES_SENDER_NAME"]
site_domain = os.environ["SITE_DOMAIN"]
template_name = os.environ["BLOG_POST_TEMPLATE_NAME"]


def get_verified_subscribers():
    """
    Scan DynamoDB for all subscribers with subscribedStatus=true AND verifiedStatus=true.
    Handles pagination automatically.
    """
    subscribers = []
    scan_kwargs = {
        "FilterExpression": Attr("subscribedStatus").eq(True) & Attr("verifiedStatus").eq(True)
    }

    try:
        while True:
            response = table.scan(**scan_kwargs)
            subscribers.extend(response.get("Items", []))

            # Check for more pages
            if "LastEvaluatedKey" not in response:
                break
            scan_kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]

        print(f"Found {len(subscribers)} verified subscribers")
        return subscribers

    except ClientError as e:
        print(f"Error scanning DynamoDB: {e.response['Error']['Message']}")
        raise


def send_bulk_notification(subscribers, title, link):
    """
    Send blog post notification to subscribers using SES SendBulkTemplatedEmail.
    Handles batching (max 50 destinations per SES call).
    Returns (success_count, failure_count).
    """
    batch_size = 50  # SES SendBulkTemplatedEmail limit
    total_sent = 0
    total_failed = 0

    for i in range(0, len(subscribers), batch_size):
        batch = subscribers[i : i + batch_size]

        # Build destinations with unique unsubscribe links
        destinations = []
        for subscriber in batch:
            email = subscriber["emailAddress"]
            token = subscriber["verificationToken"]
            unsubscribe_url = (
                f"https://{site_domain}/unsubscribe?verificationToken={token}"
            )

            destinations.append(
                {
                    "Destination": {"ToAddresses": [email]},
                    "ReplacementTemplateData": json.dumps(
                        {
                            "title": title,
                            "link": link,
                            "unsubscribe_url": unsubscribe_url,
                        }
                    ),
                }
            )

        try:
            response = ses_client.send_bulk_templated_email(
                Source=f"{sender_name} <{sender_email}>",
                Template=template_name,
                DefaultTemplateData=json.dumps(
                    {
                        "title": title,
                        "link": link,
                        "unsubscribe_url": "",  # Fallback (should never be used)
                    }
                ),
                Destinations=destinations,
            )

            # Parse response status
            for status in response.get("Status", []):
                if status.get("Status") == "Success":
                    total_sent += 1
                else:
                    total_failed += 1
                    print(
                        f"Failed to send to {status.get('MessageId')}: {status.get('Error')}"
                    )

            batch_num = i // batch_size + 1
            success_in_batch = len(
                [s for s in response.get("Status", []) if s.get("Status") == "Success"]
            )
            print(f"Batch {batch_num}: Sent {success_in_batch} emails")

        except ClientError as e:
            print(f"Error sending batch: {e.response['Error']['Message']}")
            total_failed += len(batch)

    return total_sent, total_failed


def handler(event, context):
    """
    Lambda handler invoked manually from AWS Console.
    Expected event format:
    {
        "title": "Blog Post Title",
        "link": "https://nicholastapphughes.com/blog/post-slug"
    }
    """
    try:
        # Parse input
        title = event.get("title")
        link = event.get("link")

        if not title or not link:
            return {
                "statusCode": 400,
                "body": json.dumps(
                    {"error": "Missing required fields: title and link"}
                ),
            }

        print(f"Starting notification for post: {title}")

        # Get all verified subscribers
        subscribers = get_verified_subscribers()

        if not subscribers:
            return {
                "statusCode": 200,
                "body": json.dumps(
                    {
                        "totalSubscribers": 0,
                        "emailsSent": 0,
                        "emailsFailed": 0,
                        "message": "No verified subscribers found",
                    }
                ),
            }

        # Send bulk notifications
        sent, failed = send_bulk_notification(subscribers, title, link)

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "totalSubscribers": len(subscribers),
                    "emailsSent": sent,
                    "emailsFailed": failed,
                    "message": f"Notification sent to {sent} subscribers",
                }
            ),
        }

    except ClientError as e:
        print(
            f"AWS error: {e.response['Error']['Code']} - {e.response['Error']['Message']}"
        )
        return {
            "statusCode": 500,
            "body": json.dumps(
                {
                    "error": "Internal server error",
                    "details": e.response["Error"]["Message"],
                }
            ),
        }

    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps(
                {"error": "Internal server error", "details": str(e)}
            ),
        }

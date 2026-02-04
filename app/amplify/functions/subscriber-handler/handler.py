import json
import os
import re
import secrets
from datetime import datetime, timezone
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

# Initialize AWS clients at module level for connection reuse
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["SUBSCRIBERS_TABLE_NAME"])
ses_client = boto3.client("ses", region_name="us-east-2")
sender_email = os.environ["SES_SENDER_EMAIL"]
site_domain = os.environ["SITE_DOMAIN"]


def validate_email_format(email):
    """Validate email format using regex."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def generate_verification_token():
    """Generate a cryptographically secure verification token."""
    return secrets.token_urlsafe(32)


def get_current_timestamp():
    """Get current UTC timestamp in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat()


def verification_email_cooldown_passed(existing_item, cooldown_minutes=60):
    """Check if enough time has passed since the last verification email was sent."""
    if not existing_item:
        return True

    last_sent = existing_item.get("lastVerificationEmailSent")
    if not last_sent:
        return True

    last_sent_dt = datetime.fromisoformat(last_sent.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    elapsed = (now - last_sent_dt).total_seconds() / 60

    return elapsed >= cooldown_minutes


def send_verification_email(email, token):
    """Send verification email with verification link."""
    verification_url = f"https://{site_domain}/verify?verificationToken={token}"

    html_body = f"""
    <html>
    <head></head>
    <body>
        <h2>Verify Your Subscription</h2>
        <p>Hello,</p>
        <p>You're receiving this email because someone requested to subscribe to Nick Tapp-Hughes's blog with this email address.</p>
        <p>To complete your subscription, please click the button below:</p>
        <p style="margin: 30px 0;">
            <a href="{verification_url}"
               style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Verify Subscription
            </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="{verification_url}">{verification_url}</a></p>
        <p><strong>If you didn't request this subscription, please ignore this email.</strong></p>
        <p>This subscription is free and you can unsubscribe at any time.</p>
        <p>Best regards,<br>Nick Tapp-Hughes</p>
    </body>
    </html>
    """

    text_body = f"""
Verify Your Subscription

Hello,

You're receiving this email because someone requested to subscribe to Nick Tapp-Hughes's blog with this email address.

To complete your subscription, please visit this link:
{verification_url}

If you didn't request this subscription, please ignore this email.

This subscription is free and you can unsubscribe at any time.

Best regards,
Nick Tapp-Hughes
    """

    try:
        ses_client.send_email(
            Source=sender_email,
            Destination={"ToAddresses": [email]},
            Message={
                "Subject": {
                    "Data": "Verify your subscription to Nick Tapp-Hughes's blog"
                },
                "Body": {"Text": {"Data": text_body}, "Html": {"Data": html_body}},
            },
        )
        print(f"Verification email sent to {email}")
    except ClientError as e:
        print(f"Error sending verification email: {e.response['Error']['Message']}")
        raise


def send_confirmation_email(email, token):
    """Send confirmation email with unsubscribe link."""
    unsubscribe_url = f"https://{site_domain}/unsubscribe?verificationToken={token}"

    html_body = f"""
    <html>
    <head></head>
    <body>
        <h2>Subscription Confirmed!</h2>
        <p>Hello,</p>
        <p>Your subscription to Nick Tapp-Hughes's blog has been confirmed.</p>
        <p>You'll receive email notifications whenever a new blog post is published. This subscription is free.</p>
        <p>If you ever want to unsubscribe, you can do so at any time by clicking the link below:</p>
        <p><a href="{unsubscribe_url}">Unsubscribe</a></p>
        <p>Thank you for subscribing!</p>
        <p>Best regards,<br>Nick Tapp-Hughes</p>
    </body>
    </html>
    """

    text_body = f"""
Subscription Confirmed!

Hello,

Your subscription to Nick Tapp-Hughes's blog has been confirmed.

You'll receive email notifications whenever a new blog post is published. This subscription is free.

If you ever want to unsubscribe, you can do so at any time by visiting:
{unsubscribe_url}

Thank you for subscribing!

Best regards,
Nick Tapp-Hughes
    """

    try:
        ses_client.send_email(
            Source=sender_email,
            Destination={"ToAddresses": [email]},
            Message={
                "Subject": {
                    "Data": "You are now subscribed to Nick Tapp-Hughes's blog"
                },
                "Body": {"Text": {"Data": text_body}, "Html": {"Data": html_body}},
            },
        )
        print(f"Confirmation email sent to {email}")
    except ClientError as e:
        print(f"Error sending confirmation email: {e.response['Error']['Message']}")
        raise


def handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    raw_path = event.get("rawPath", "")
    query_params = event.get("queryStringParameters") or {}

    if method == "POST" and raw_path.endswith("/subscribe"):
        return handle_subscribe(event)
    elif method == "PATCH" and raw_path.endswith("/verify"):
        return handle_verify(query_params)
    elif method == "DELETE" and raw_path.endswith("/unsubscribe"):
        return handle_unsubscribe(query_params)
    else:
        return {"statusCode": 400}


def handle_subscribe(event):
    try:
        body = json.loads(event.get("body", "{}"))
        email = body.get("emailAddress")

        if not email:
            return {"statusCode": 400}

        # Validate email format
        if not validate_email_format(email):
            return {"statusCode": 422}

        # Check if subscriber already exists
        response = table.get_item(Key={"emailAddress": email})
        existing_item = response.get("Item")

        # If already subscribed and verified, return 201 anyway to prevent email enumeration
        if existing_item:
            if existing_item.get("subscribedStatus") and existing_item.get(
                "verifiedStatus"
            ):
                return {"statusCode": 201}

        # Preserve verification token if record exists, otherwise generate new one
        # This ensures all verification/unsubscribe links remain valid
        if existing_item and existing_item.get("verificationToken"):
            token = existing_item.get("verificationToken")
        else:
            token = generate_verification_token()

        now = get_current_timestamp()

        # Preserve createdAt if re-subscribing
        created_at = existing_item.get("createdAt", now) if existing_item else now

        # Build item with conditional lastVerificationEmailSent
        item = {
            "emailAddress": email,
            "verificationToken": token,
            "subscribedStatus": False,
            "verifiedStatus": True
            if (existing_item and existing_item.get("verifiedStatus"))
            else False,
            "subscribedAt": now,
            "createdAt": created_at,
            "updatedAt": now,
        }

        # Check if we should send a verification email (rate limit to prevent harassment)
        verification_cooldown_passed = verification_email_cooldown_passed(existing_item)

        # Only update lastVerificationEmailSent if we're actually sending an email
        if verification_cooldown_passed:
            item["lastVerificationEmailSent"] = now
        elif existing_item and existing_item.get("lastVerificationEmailSent"):
            # Preserve existing timestamp if not sending
            item["lastVerificationEmailSent"] = existing_item.get(
                "lastVerificationEmailSent"
            )

        # Create or update subscriber record
        table.put_item(Item=item)

        # Send verification email only if cooldown has passed
        if verification_cooldown_passed:
            send_verification_email(email, token)

        return {"statusCode": 201}

    except ClientError as e:
        print(
            f"AWS error: {e.response['Error']['Code']} - {e.response['Error']['Message']}"
        )
        return {"statusCode": 500}
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {"statusCode": 500}


def handle_verify(query_params):
    try:
        token = query_params.get("verificationToken")

        if not token:
            return {"statusCode": 400}

        # Query by verification token using secondary index
        response = table.query(
            IndexName="ByVerificationToken",
            KeyConditionExpression=Key("verificationToken").eq(token),
        )
        items = response.get("Items", [])

        if not items:
            return {"statusCode": 404}

        item = items[0]
        email = item["emailAddress"]

        # Check if already verified and subscribed (idempotent)
        if item.get("verifiedStatus") and item.get("subscribedStatus"):
            return {"statusCode": 200}

        # Update subscriber to verified and subscribed with conditional expression
        # This prevents duplicate emails if verification link is clicked multiple times
        now = get_current_timestamp()
        try:
            table.update_item(
                Key={"emailAddress": email},
                UpdateExpression="SET subscribedStatus = :s, verifiedStatus = :v, verifiedAt = :va, updatedAt = :u",
                ConditionExpression="attribute_not_exists(verifiedStatus) OR verifiedStatus = :false",
                ExpressionAttributeValues={
                    ":s": True,
                    ":v": True,
                    ":va": now,
                    ":u": now,
                    ":false": False,
                },
            )
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                # Item was already verified by another concurrent request
                print(f"Item already verified for {email}, skipping email")
                return {"statusCode": 200}
            raise

        # Send confirmation email only if update succeeded
        send_confirmation_email(email, token)

        return {"statusCode": 200}

    except ClientError as e:
        print(
            f"AWS error: {e.response['Error']['Code']} - {e.response['Error']['Message']}"
        )
        return {"statusCode": 500}
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {"statusCode": 500}


def handle_unsubscribe(query_params):
    try:
        token = query_params.get("verificationToken")

        if not token:
            return {"statusCode": 400}

        # Query by verification token using secondary index
        response = table.query(
            IndexName="ByVerificationToken",
            KeyConditionExpression=Key("verificationToken").eq(token),
        )
        items = response.get("Items", [])

        if not items:
            return {"statusCode": 404}

        item = items[0]
        email = item["emailAddress"]

        # Return early if already unsubscribed (don't update the item)
        if not item["subscribedStatus"]:
            return {"statusCode": 200}

        # Update subscriber to unsubscribed (keep verifiedStatus as is)
        now = get_current_timestamp()
        table.update_item(
            Key={"emailAddress": email},
            UpdateExpression="SET subscribedStatus = :s, updatedAt = :u",
            ExpressionAttributeValues={":s": False, ":u": now},
        )

        return {"statusCode": 200}

    except ClientError as e:
        print(
            f"AWS error: {e.response['Error']['Code']} - {e.response['Error']['Message']}"
        )
        return {"statusCode": 500}
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {"statusCode": 500}

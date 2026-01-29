import json


def handler(event, context):
    body = json.loads(event.get("body", "{}"))
    action = body.get("action", "")

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "body": json.dumps({
            "message": f"Received action: {action}",
            "action": action,
        }),
    }

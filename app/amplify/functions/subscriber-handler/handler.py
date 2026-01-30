import json


def handler(event, context):
    body = json.loads(event.get("body", "{}"))
    action = body.get("action", "")

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": f"Received action: {action}",
            "action": action,
        }),
    }

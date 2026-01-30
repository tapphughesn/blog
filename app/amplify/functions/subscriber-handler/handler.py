import json


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
    body = json.loads(event.get("body", "{}"))
    email = body.get("emailAddress")

    if not email:
        return {"statusCode": 400}

    # TODO: implement subscribe logic
    return {"statusCode": 201}


def handle_verify(query_params):
    token = query_params.get("verificationToken")

    if not token:
        return {"statusCode": 400}

    # TODO: implement verify logic
    return {"statusCode": 200}


def handle_unsubscribe(query_params):
    token = query_params.get("verificationToken")

    if not token:
        return {"statusCode": 400}

    # TODO: implement unsubscribe logic
    return {"statusCode": 200}

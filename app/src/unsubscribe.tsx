import "./App.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { unsubscribe } from "./subscriberApi";

function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Unsubscribing...");

  useEffect(() => {
    const token = searchParams.get("verificationToken");
    if (!token) {
      setMessage("Invalid unsubscribe link.");
      return;
    }

    unsubscribe(token).then((status) => {
      if (status === 200) {
        setMessage("You have been unsubscribed. You may now close this window.");
      } else if (status === 404) {
        setMessage("This unsubscribe link is broken; the user was not found.");
      } else {
        setMessage("Unsubscribe failed. Try again later.");
      }
    }).catch(() => {
      setMessage("Error: could not reach server. Try again later.");
    });
  }, [searchParams]);

  return (
    <div>
      <h3>Unsubscribe from Emails</h3>
      <p>{message}</p>
    </div>
  );
}

export default Unsubscribe;

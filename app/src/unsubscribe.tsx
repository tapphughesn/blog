import "./App.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { unsubscribe } from "./subscriberApi";

function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Click the button below to unsubscribe from email notifications.");
  const [isProcessing, setIsProcessing] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const verificationToken = searchParams.get("verificationToken");
    setToken(verificationToken);
    if (!verificationToken) {
      setMessage("Invalid unsubscribe link.");
    }
  }, [searchParams]);

  const handleUnsubscribeClick = async () => {
    if (!token) {
      return;
    }

    setIsProcessing(true);
    setMessage("Unsubscribing...");

    try {
      const status = await unsubscribe(token);
      if (status === 200) {
        setMessage("You have been unsubscribed. You may now close this window.");
      } else if (status === 404) {
        setMessage("This unsubscribe link is broken; the user was not found.");
      } else {
        setMessage("Unsubscribe failed. Try again later.");
      }
    } catch {
      setMessage("Error: could not reach server. Try again later.");
    }
  };

  return (
    <div>
      <h3>Unsubscribe from Emails</h3>
      <p>{message}</p>
      <button
        className="confirmation-button"
        onClick={handleUnsubscribeClick}
        disabled={!token || isProcessing}
      >
        Unsubscribe
      </button>
    </div>
  );
}

export default Unsubscribe;

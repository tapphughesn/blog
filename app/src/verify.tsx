import "./App.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { verify } from "./subscriberApi";

function Verify() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Click the button below to verify your email and complete your subscription.");
  const [isProcessing, setIsProcessing] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const verificationToken = searchParams.get("verificationToken");
    setToken(verificationToken);
    if (!verificationToken) {
      setMessage("Invalid verification link.");
    }
  }, [searchParams]);

  const handleVerifyClick = async () => {
    if (!token) {
      return;
    }

    setIsProcessing(true);
    setMessage("Verifying...");

    try {
      const status = await verify(token);
      if (status === 200) {
        setMessage(`Verification succeeded! You are now subscribed to my blog.
                   Check your email for further confirmation.`);
      } else if (status === 404) {
        setMessage("This verification link is broken; the user was not found.");
      } else {
        setMessage("Verification failed. Try again later.");
      }
    } catch {
      setMessage("Error: could not reach server. Try again later.");
    }
  };

  return (
    <div>
      <h3>Email Verification</h3>
      <p>{message}</p>
      <button
        className="confirmation-button"
        onClick={handleVerifyClick}
        disabled={!token || isProcessing}
      >
        Verify Email
      </button>
    </div>
  );
}

export default Verify;

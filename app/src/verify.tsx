import "./App.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { verify } from "./subscriberApi";

function Verify() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    const token = searchParams.get("verificationToken");
    if (!token) {
      setMessage("Invalid verification link.");
      return;
    }

    verify(token).then((status) => {
      if (status === 200) {
        setMessage(`Verification succeeded! You are now subscribed to my blog.
                   Check your email for further confirmation.`);
      } else if (status === 404) {
        setMessage("User not found.");
      } else {
        setMessage("Verification failed. Try again later.");
      }
    }).catch(() => {
      setMessage("Error: could not reach server. Try again later.");
    });
  }, [searchParams]);

  return (
    <div>
      <h3>Email Verification</h3>
      <p>{message}</p>
    </div>
  );
}

export default Verify;

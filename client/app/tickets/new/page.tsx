import Link from "next/link";

import TicketForm from "@/components/TicketForm";

export default function NewTicketPage() {
  return (
    <div>
      <div className="page-head">
        <h1>New ticket</h1>
        <Link href="/" className="button">
          Back to tickets
        </Link>
      </div>
      <TicketForm />
    </div>
  );
}

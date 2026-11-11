export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: "active" | "unsubscribed";
  createdAt: string;
}


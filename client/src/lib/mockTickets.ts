export interface TicketMessage {
  id: string;
  from: string;
  fromEmail: string;
  fromRole: "customer" | "agent" | "system";
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  isRead: boolean;
}

export interface SupportTicket {
  caseId: string;
  ticketId: string;
  subject: string;
  channel: "email" | "chat" | "portal";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  messages: TicketMessage[];
}

const ticketTemplates: Record<string, SupportTicket> = {
  "RC-001": {
    caseId: "RC-001",
    ticketId: "TKT-88234",
    subject: "Refund Request — Le Bernadin Tasting Menu (BK-887234)",
    channel: "email",
    priority: "high",
    createdAt: "2026-03-02T09:15:00Z",
    messages: [
      {
        id: "msg-001-1",
        from: "Marcus Chen",
        fromEmail: "marcus.chen@email.com",
        fromRole: "customer",
        to: "support@headout.com",
        subject: "Refund Request — Le Bernadin Tasting Menu (BK-887234)",
        body: `Hi,

I'm writing to request a full refund for my booking at Le Bernadin Tasting Menu (Booking ID: BK-887234, Date: March 1st, 2026 at 7:00 PM).

Unfortunately, I was unable to attend the experience. I had a family emergency that came up last minute and could not make it to the venue. I understand this is disappointing and I apologize for the late notice, but the circumstances were completely out of my control.

The booking value was $420 and I'd appreciate a full refund to my original payment method.

Please let me know if you need any additional information.

Best regards,
Marcus Chen`,
        timestamp: "2026-03-02T09:15:00Z",
        isRead: true,
      },
      {
        id: "msg-001-2",
        from: "Headout Support",
        fromEmail: "support@headout.com",
        fromRole: "agent",
        to: "marcus.chen@email.com",
        subject: "Re: Refund Request — Le Bernadin Tasting Menu (BK-887234)",
        body: `Dear Marcus,

Thank you for reaching out to Headout Support. We've received your refund request for booking BK-887234.

We understand that emergencies happen, and we're sorry to hear about your situation. Your request is currently under review by our team.

We'll get back to you within 24 hours with a decision. In the meantime, if you have any supporting documentation regarding the emergency, please feel free to attach it to your reply.

Kind regards,
Headout Customer Support`,
        timestamp: "2026-03-02T09:45:00Z",
        isRead: true,
      },
      {
        id: "msg-001-3",
        from: "Marcus Chen",
        fromEmail: "marcus.chen@email.com",
        fromRole: "customer",
        to: "support@headout.com",
        subject: "Re: Refund Request — Le Bernadin Tasting Menu (BK-887234)",
        body: `Thank you for the quick response.

I don't have documentation as it was a personal matter. I trust that my long history as a Headout customer speaks for itself. I've used the platform many times and this is the first time something like this has come up.

I really hope you can process this refund quickly as I'm in a difficult financial position right now.

Marcus`,
        timestamp: "2026-03-02T10:30:00Z",
        isRead: true,
      },
    ],
  },

  "RC-003": {
    caseId: "RC-003",
    ticketId: "TKT-33456",
    subject: "Urgent Refund — Grand Canyon Helicopter Tour (BK-334556)",
    channel: "email",
    priority: "urgent",
    createdAt: "2026-03-02T08:30:00Z",
    messages: [
      {
        id: "msg-003-1",
        from: "Tyler Brooks",
        fromEmail: "tbrooks99@outlook.com",
        fromRole: "customer",
        to: "support@headout.com",
        subject: "Urgent Refund — Grand Canyon Helicopter Tour (BK-334556)",
        body: `Hello,

I need an urgent refund for my Grand Canyon Helicopter Tour (BK-334556) scheduled for today at 1:00 PM. I'm cancelling due to a sudden illness — I woke up with a severe migraine this morning and am not in any condition to participate.

I paid $580 for this experience and am requesting a full refund. I know it's last minute but I genuinely cannot attend.

Please process this ASAP.

Tyler Brooks`,
        timestamp: "2026-03-02T08:30:00Z",
        isRead: true,
      },
      {
        id: "msg-003-2",
        from: "Headout Support",
        fromEmail: "support@headout.com",
        fromRole: "agent",
        to: "tbrooks99@outlook.com",
        subject: "Re: Urgent Refund — Grand Canyon Helicopter Tour (BK-334556)",
        body: `Dear Tyler,

Thank you for contacting us. We've received your cancellation request for BK-334556.

Please note that our standard policy requires cancellation at least 24 hours before the experience for high-value bookings. Your request is being reviewed by our team given the circumstances.

We'll update you shortly.

Best,
Headout Support`,
        timestamp: "2026-03-02T09:00:00Z",
        isRead: true,
      },
    ],
  },

  "RC-004": {
    caseId: "RC-004",
    ticketId: "TKT-44578",
    subject: "Technical Issue — MoMA Private Tour Access (BK-445781)",
    channel: "portal",
    priority: "medium",
    createdAt: "2026-03-02T11:00:00Z",
    messages: [
      {
        id: "msg-004-1",
        from: "Aisha Johnson",
        fromEmail: "aisha.j@yahoo.com",
        fromRole: "customer",
        to: "support@headout.com",
        subject: "Technical Issue — MoMA Private Tour Access (BK-445781)",
        body: `Hello Headout Support Team,

I'm reaching out regarding a technical issue I experienced with booking BK-445781 for the MoMA Private Tour on March 2nd.

When I arrived at the venue this morning, I was unable to access my digital ticket. The app kept showing an error saying "Ticket not found" even though I had a valid booking confirmation. The venue staff could not verify my booking either, and I ended up having to leave without experiencing the tour.

This is entirely a technical failure on Headout's part, and I am requesting a full refund of $120.

I am very disappointed with this experience and expect this to be resolved promptly.

Aisha Johnson`,
        timestamp: "2026-03-02T11:00:00Z",
        isRead: true,
      },
      {
        id: "msg-004-2",
        from: "Headout Support",
        fromEmail: "support@headout.com",
        fromRole: "agent",
        to: "aisha.j@yahoo.com",
        subject: "Re: Technical Issue — MoMA Private Tour Access (BK-445781)",
        body: `Dear Aisha,

We're sorry to hear about the difficulty you experienced. We take technical issues very seriously.

Your case has been escalated to our technical team for investigation. We are looking into the reported issue and will provide an update within 4 hours.

Thank you for your patience.

Headout Support Team`,
        timestamp: "2026-03-02T11:30:00Z",
        isRead: true,
      },
    ],
  },

  "RC-007": {
    caseId: "RC-007",
    ticketId: "TKT-77445",
    subject: "No-Show Refund Request — Napa Valley Wine Tour (BK-774455)",
    channel: "email",
    priority: "high",
    createdAt: "2026-03-02T07:45:00Z",
    messages: [
      {
        id: "msg-007-1",
        from: "James Wu",
        fromEmail: "jwu@techcorp.io",
        fromRole: "customer",
        to: "support@headout.com",
        subject: "No-Show Refund Request — Napa Valley Wine Tour (BK-774455)",
        body: `Hi Support,

I'm requesting a refund for the Napa Valley Wine Tasting Tour (BK-774455) that was scheduled for yesterday, March 1st at 10:00 AM.

I unfortunately was unable to attend. I had a work meeting that ran much longer than expected and simply could not make it in time. By the time I was free, the tour had already started.

I'm requesting a full refund of $260. I've been a customer for a while and this is not something I do regularly.

Thank you for understanding,
James Wu`,
        timestamp: "2026-03-02T07:45:00Z",
        isRead: true,
      },
      {
        id: "msg-007-2",
        from: "Headout Support",
        fromEmail: "support@headout.com",
        fromRole: "agent",
        to: "jwu@techcorp.io",
        subject: "Re: No-Show Refund Request — Napa Valley Wine Tour (BK-774455)",
        body: `Dear James,

Thank you for reaching out. We've received your refund request for BK-774455.

We understand that unexpected situations can arise. Your request is currently under review and we'll get back to you with a decision shortly.

Best,
Headout Customer Support`,
        timestamp: "2026-03-02T08:15:00Z",
        isRead: true,
      },
    ],
  },

  "RC-017": {
    caseId: "RC-017",
    ticketId: "TKT-66778",
    subject: "Refund — Blue Note Jazz Evening (BK-667782)",
    channel: "chat",
    priority: "urgent",
    createdAt: "2026-03-02T13:30:00Z",
    messages: [
      {
        id: "msg-017-1",
        from: "Frank Russo",
        fromEmail: "frank.russo@icloud.com",
        fromRole: "customer",
        to: "support@headout.com",
        subject: "Refund — Blue Note Jazz Evening (BK-667782)",
        body: `Hello,

I'm requesting a refund for the Wine & Jazz Evening at Blue Note NYC (BK-667782) that was this morning at 7:30 AM. I was unable to attend as I had a sudden transportation issue — the subway was completely down in my area due to an incident.

I know this is after the fact but the situation was completely out of my control. I've been a loyal customer and have attended many events through Headout before.

Please process my refund of $175.

Frank Russo`,
        timestamp: "2026-03-02T13:30:00Z",
        isRead: true,
      },
      {
        id: "msg-017-2",
        from: "Headout Support",
        fromEmail: "support@headout.com",
        fromRole: "agent",
        to: "frank.russo@icloud.com",
        subject: "Re: Refund — Blue Note Jazz Evening (BK-667782)",
        body: `Dear Frank,

Thank you for contacting Headout. We've received your refund request for BK-667782.

Your case is under review. We'll be in touch shortly.

Headout Support`,
        timestamp: "2026-03-02T13:45:00Z",
        isRead: true,
      },
      {
        id: "msg-017-3",
        from: "Frank Russo",
        fromEmail: "frank.russo@icloud.com",
        fromRole: "customer",
        to: "support@headout.com",
        subject: "Re: Refund — Blue Note Jazz Evening (BK-667782)",
        body: `How long will this take? I need this resolved today. I've been waiting for a response for hours. This is the second time I've had to request a refund this month and both times the process has been slow.

Please expedite my case.`,
        timestamp: "2026-03-02T14:30:00Z",
        isRead: false,
      },
    ],
  },

  "RC-023": {
    caseId: "RC-023",
    ticketId: "TKT-77823",
    subject: "Cancellation — Private Helicopter NYC Night Tour (BK-778234)",
    channel: "email",
    priority: "urgent",
    createdAt: "2026-03-02T08:15:00Z",
    messages: [
      {
        id: "msg-023-1",
        from: "Omar Abdullah",
        fromEmail: "o.abdullah@dubai.ae",
        fromRole: "customer",
        to: "support@headout.com",
        subject: "Cancellation — Private Helicopter NYC Night Tour (BK-778234)",
        body: `Dear Headout Team,

I would like to cancel and receive a full refund for my Private Helicopter NYC Night Tour booking (BK-778234) scheduled for this evening at 8:15 PM. I need to cancel due to an urgent business matter that requires my immediate attention.

The booking value was $1,800 and I expect a full refund to my card ending in 4821.

This is time-sensitive as the tour is this evening. Please confirm receipt and expected refund timeline.

Best regards,
Omar Abdullah`,
        timestamp: "2026-03-02T08:15:00Z",
        isRead: true,
      },
      {
        id: "msg-023-2",
        from: "Headout Support",
        fromEmail: "support@headout.com",
        fromRole: "agent",
        to: "o.abdullah@dubai.ae",
        subject: "Re: Cancellation — Private Helicopter NYC Night Tour (BK-778234)",
        body: `Dear Mr. Abdullah,

Thank you for reaching out. We have received your cancellation request for booking BK-778234.

Given the proximity to your experience time, this case requires review under our high-value cancellation policy. Our team is assessing your request and will respond within the next 2 hours.

We appreciate your understanding.

Kind regards,
Headout VIP Support Team`,
        timestamp: "2026-03-02T08:45:00Z",
        isRead: true,
      },
    ],
  },
};

const DEFAULT_TICKET: SupportTicket = {
  caseId: "",
  ticketId: "TKT-00000",
  subject: "Refund Request",
  channel: "email",
  priority: "medium",
  createdAt: new Date().toISOString(),
  messages: [],
};

export function getTicketForCase(caseId: string): SupportTicket {
  return ticketTemplates[caseId] || {
    ...DEFAULT_TICKET,
    caseId,
    ticketId: `TKT-${caseId.replace("RC-", "")}00`,
    subject: `Refund Request — Case ${caseId}`,
    messages: [
      {
        id: `msg-${caseId}-default`,
        from: "Customer",
        fromEmail: "customer@email.com",
        fromRole: "customer",
        to: "support@headout.com",
        subject: `Refund Request — Case ${caseId}`,
        body: "I would like to request a refund for my recent booking. Please review my case and let me know the status.",
        timestamp: new Date().toISOString(),
        isRead: true,
      },
    ],
  };
}

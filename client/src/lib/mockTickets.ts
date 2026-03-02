import type { RefundCase } from "@shared/schema";

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

function caseHash(caseId: string): number {
  let h = 0;
  for (let i = 0; i < caseId.length; i++) h = (h * 31 + caseId.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function addMinutes(iso: string, mins: number): string {
  return new Date(new Date(iso).getTime() + mins * 60 * 1000).toISOString();
}

function addHours(iso: string, hours: number): string {
  return addMinutes(iso, hours * 60);
}

function fmt(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

function getNoShowExcuse(seed: number, c: RefundCase): string {
  const excuses = [
    `I was involved in a family emergency yesterday that completely prevented me from attending. It was a sudden situation and I had no way to notify you in advance.`,
    `A work meeting I couldn't escape ran several hours over schedule. By the time I was available, the experience had already started and I couldn't make it.`,
    `I fell seriously ill this morning — a severe migraine that left me bedridden. I was in no condition to travel to the venue, and I genuinely couldn't reach out until now.`,
    `There was a major transportation disruption in my area. The subway lines were suspended due to an incident and there were no taxis or rideshares available. I was completely stuck.`,
    `I had a personal emergency involving a close friend that required my immediate presence elsewhere. I couldn't attend and I am deeply sorry for the late notice.`,
    `My flight into the city was cancelled due to mechanical issues and I was stranded at the airport. I arrived too late to make it to the experience and I'm requesting a refund.`,
  ];
  return pick(excuses, seed);
}

function getNoShowFollowUp(seed: number, c: RefundCase): string {
  const followUps = [
    `I understand your policies, but the circumstances were truly out of my control. I've been a customer for ${c.customerTenureMonths} months and this is a rare situation for me. I appreciate your understanding.`,
    `I don't have formal documentation to share, but I hope you can take my word as a loyal customer. Please process this refund — I really need it.`,
    `Is there any update on my case? I submitted this yesterday and haven't heard back. ${fmt(c.refundAmount)} is a significant amount and I'm eager to resolve this.`,
    `I just wanted to follow up on my earlier message. I understand you're busy, but could you give me a timeline for when I can expect a decision?`,
    `I want to reiterate that this is not something I make a habit of. I love Headout's experiences and plan to continue using the platform. A refund in this case would go a long way.`,
  ];
  return pick(followUps, seed + 1);
}

function getCancellationReason(seed: number, c: RefundCase): string {
  const isUrgent = c.refundTimingHours < 24;
  const isNear = c.refundTimingHours < 72;

  const reasonsFuture = [
    `I need to cancel due to a scheduling conflict that came up unexpectedly. A prior commitment has been moved and now directly overlaps with my booking.`,
    `My travel plans have changed and I'm no longer able to be in the city for this experience. I'm requesting a full refund.`,
    `Unfortunately, a family obligation has come up that takes priority. I won't be able to attend the experience and would like to cancel.`,
    `I've had an unexpected change in my work schedule. I'm being asked to travel for work on the same day and will not be able to attend.`,
    `My group's plans have changed and the other attendees can no longer join. We'd prefer not to attend with an incomplete group, so I'm requesting a cancellation.`,
    `I need to reschedule due to a personal health matter. I'm recovering from a procedure and my doctor has advised me to rest.`,
  ];
  const reasonsUrgent = [
    `I'm writing urgently — I need to cancel my experience today. An unexpected business matter has come up and requires my immediate presence elsewhere.`,
    `I need to cancel ASAP. I'm dealing with a last-minute situation and cannot attend this evening. I know this is very short notice and I apologize.`,
    `Something urgent has come up and I cannot make it to the experience today. Please process my refund as quickly as possible as the experience is in just a few hours.`,
  ];
  return isUrgent ? pick(reasonsUrgent, seed) : pick(reasonsFuture, seed);
}

function getTechExcuse(seed: number, c: RefundCase): string {
  const excuses = [
    `When I arrived at the venue, the app kept showing an error — "Booking not found" — even though I had a valid confirmation. The staff couldn't verify my booking either and I was turned away at the door.`,
    `The QR code in my confirmation email wouldn't load on my phone. I tried multiple times, restarted the app, and even switched to mobile data — nothing worked. The venue had no manual override and I couldn't enter.`,
    `The Headout app crashed repeatedly when I tried to open my ticket at the venue. After spending 20 minutes troubleshooting, the session had already started and I missed the beginning.`,
    `I received a "ticket invalid" error at the gate. Despite having a booking confirmation, the scanner rejected my code three times. A staff member said the booking appeared "unconfirmed" on their end.`,
    `The platform wouldn't let me access my booking on the day of the event. I got a blank screen every time I navigated to "My Bookings." This is clearly a technical failure on Headout's part.`,
    `My digital tickets simply didn't appear in the app on the day of the experience. The email confirmation link led to a 404 error page. I had no way to prove my booking at the venue.`,
  ];
  return pick(excuses, seed);
}

function getWeatherReason(seed: number, c: RefundCase): string {
  const reasons = [
    `I'm reaching out ahead of my upcoming experience because the weather forecast for that day looks very concerning. Heavy rain and strong winds are predicted, which would make an outdoor experience uncomfortable and potentially unsafe.`,
    `The weather forecast is showing severe thunderstorms on the day of my booking. As this is an outdoor experience, I don't feel it would be safe or enjoyable to proceed. I'd like to request a full refund.`,
    `I've been monitoring the weather for my upcoming experience and the conditions are looking very poor. The forecast shows extreme heat that would make participation difficult. I'd like to cancel in advance rather than risk it.`,
    `Given the storm advisory that's been issued for the area, I'm not comfortable attending an outdoor experience. I'd prefer to get a refund and potentially rebook when conditions are better.`,
    `The forecast is showing an unexpected blizzard/cold snap for the day of my booking. I don't think it would be safe or practical to attend an outdoor event under those conditions.`,
  ];
  return pick(reasons, seed);
}

function getOtherReason(seed: number, c: RefundCase): string {
  const reasons = [
    `I'd like to request a refund for my upcoming booking. My circumstances have changed in a way I wasn't able to anticipate and attending is no longer feasible for me.`,
    `I'm writing to request a cancellation and refund. Without going into extensive detail, I'm dealing with a personal situation that makes attending impossible at this time.`,
    `I've given this a lot of thought and I need to cancel my booking. I'd prefer a refund to an experience credit, as my plans have changed significantly.`,
    `Please process a refund for my upcoming booking. I have a genuine reason for cancelling, but would prefer to keep the details private. I've been a loyal customer and trust you'll accommodate this.`,
  ];
  return pick(reasons, seed);
}

function getFirstAgentResponse(c: RefundCase, includesEscalation: boolean): string {
  if (includesEscalation) {
    return `Dear ${c.customerName},\n\nThank you for contacting Headout Support. We've received your request regarding booking ${c.bookingId}.\n\nGiven the nature of your case, this has been flagged for review by our specialized team. A dedicated agent will assess your situation and respond within 4 hours.\n\nWe appreciate your patience.\n\nKind regards,\nHeadout Customer Support`;
  }

  const responses = [
    `Dear ${c.customerName},\n\nThank you for reaching out to Headout Support. We've received your refund request for booking ${c.bookingId} (${c.experienceName}).\n\nYour case is currently under review by our team. We aim to respond with a decision within 24 hours. If you have any supporting documentation relevant to your request, please feel free to attach it to your reply.\n\nWe appreciate your patience.\n\nKind regards,\nHeadout Customer Support`,
    `Dear ${c.customerName},\n\nThank you for contacting us. We have received your request regarding booking ${c.bookingId}.\n\nOur support team is currently reviewing your case. You can expect a response within the next 24 hours.\n\nBest regards,\nHeadout Customer Support`,
    `Hi ${c.customerName},\n\nWe've received your message regarding booking ${c.bookingId} — ${c.experienceName}.\n\nOur team is looking into this and will be in touch shortly. Thank you for your patience.\n\nHeadout Support`,
  ];
  return pick(responses, caseHash(c.id) + 3);
}

function getHighValueAgentResponse(c: RefundCase): string {
  return `Dear ${c.customerName},\n\nThank you for reaching out. We have received your request regarding booking ${c.bookingId} (${c.experienceName}).\n\nGiven the value of this booking (${fmt(c.refundAmount)}), this case is being reviewed by our senior team under our high-value experience policy. You can expect a response within 2 hours.\n\nWe appreciate your understanding and patience.\n\nKind regards,\nHeadout VIP Support Team`;
}

function buildMessages(c: RefundCase): TicketMessage[] {
  const seed = caseHash(c.id);
  const firstName = c.customerName.split(" ")[0];
  const t0 = c.requestDate;
  const msgs: TicketMessage[] = [];

  function msg(
    role: "customer" | "agent" | "system",
    body: string,
    offsetMins: number,
    isRead = true,
    subject?: string
  ): TicketMessage {
    const ts = addMinutes(t0, offsetMins);
    return {
      id: `msg-${c.id}-${msgs.length + 1}`,
      from: role === "customer" ? c.customerName : role === "agent" ? "Headout Support" : "System",
      fromEmail: role === "customer" ? c.customerEmail : role === "system" ? "system@headout.com" : "support@headout.com",
      fromRole: role,
      to: role === "customer" ? "support@headout.com" : c.customerEmail,
      subject: subject || getSubject(c),
      body,
      timestamp: ts,
      isRead: role === "agent" || role === "system" ? true : isRead,
    };
  }

  const isHighValue = c.refundAmount >= 500;
  const isSerial = c.refundCountLast6Months >= 10 || c.totalRefundCount >= 15;
  const greetings = ["Hi,", "Hello,", "Hello Support Team,", "Dear Headout Team,", "Hi Support,", `Dear ${firstName},`];
  const greeting = pick(greetings, seed + 2);

  if (c.refundReason === "no_show") {
    const excuse = getNoShowExcuse(seed, c);
    const tenureNote = c.customerTenureMonths >= 24
      ? `\n\nI've been a Headout customer for over ${Math.floor(c.customerTenureMonths / 12)} years and this kind of situation is very unlike me.`
      : c.customerTenureMonths >= 12
      ? `\n\nI've been using Headout for over a year and this doesn't reflect my typical behavior.`
      : "";

    msgs.push(msg("customer", `${greeting}\n\n${excuse}\n\nI'm requesting a full refund of ${fmt(c.refundAmount)} for the "${c.experienceName}" (Booking ID: ${c.bookingId}).${tenureNote}\n\nPlease let me know what you need from my end.\n\nBest regards,\n${c.customerName}`, 0));

    if (isHighValue) {
      msgs.push(msg("agent", getHighValueAgentResponse(c), 30));
    } else {
      msgs.push(msg("agent", getFirstAgentResponse(c, false), pick([20, 30, 45, 60], seed)), );
    }

    const followUp = getNoShowFollowUp(seed, c);
    const wantsFollowUp = (seed % 3) !== 0;
    if (wantsFollowUp) {
      msgs.push(msg("customer", followUp, pick([90, 120, 180, 240], seed + 5), (seed % 5) === 0 ? false : true));
    }

    if (isSerial) {
      const agentFollowUp = `Dear ${c.customerName},\n\nThank you for your follow-up. We want to assure you that your case is receiving careful attention.\n\nOur review process involves examining account history alongside the circumstances described. We'll have a decision for you shortly.\n\nThank you for your patience.\n\nHeadout Customer Support`;
      msgs.push(msg("agent", agentFollowUp, 300));
    }

  } else if (c.refundReason === "cancellation") {
    const reason = getCancellationReason(seed, c);
    const isUrgent = c.refundTimingHours < 24;

    msgs.push(msg("customer", `${greeting}\n\n${reason}\n\nBooking: ${c.bookingId} — ${c.experienceName}\nRefund requested: ${fmt(c.refundAmount)}\n\n${isUrgent ? "This is time-sensitive as the experience is today. Please confirm receipt and process this urgently." : "I'd appreciate a confirmation once this is processed."}\n\nThank you,\n${c.customerName}`, 0));

    if (isHighValue) {
      msgs.push(msg("agent", getHighValueAgentResponse(c), 30));

      if ((seed % 2) === 0) {
        msgs.push(msg("customer", `Thank you for the quick response. I understand the policy review is necessary given the amount. Please expedite this as much as possible — I need certainty before this evening.\n\n${c.customerName}`, 50));
      }
    } else {
      msgs.push(msg("agent", getFirstAgentResponse(c, false), pick([15, 25, 40, 60], seed)));

      if (isUrgent && (seed % 2) === 0) {
        msgs.push(msg("customer", `I appreciate the quick reply. Is there any way to expedite the decision? The experience is in just a few hours. Thank you.\n\n${firstName}`, 70, false));
      }
    }

  } else if (c.refundReason === "technical_issue") {
    const techExcuse = getTechExcuse(seed, c);
    const engagedNote = c.emailEngagement === "opened"
      ? `\n\nI understand you may have records of email engagement, but I can assure you that any activity shown was me simply trying to access my ticket — not me actually attending the experience.`
      : "";

    msgs.push(msg("customer", `${greeting}\n\nI'm writing to report a technical issue that prevented me from attending "${c.experienceName}" (Booking: ${c.bookingId}).\n\n${techExcuse}${engagedNote}\n\nThis is entirely Headout's technical failure and I am requesting a full refund of ${fmt(c.refundAmount)}. I'm very disappointed — this was supposed to be a special experience.\n\nRegards,\n${c.customerName}`, 0));

    const techResponse = `Dear ${c.customerName},\n\nWe're sorry to hear about the difficulties you experienced with booking ${c.bookingId}.\n\nWe take technical issues very seriously. Your case has been escalated to our technical team, who will investigate the reported issue and verify the system logs. We will provide you with a detailed update within 4 hours.\n\nWe appreciate your patience and apologize for the inconvenience.\n\nHeadout Support Team`;
    msgs.push(msg("agent", techResponse, pick([25, 35, 50], seed)));

    const techFollowUp = pick([
      `Thank you for the response. I'll await your technical team's findings. For reference, I was at the venue at the correct time — you can check with the venue staff. Please process my refund promptly.\n\n${firstName}`,
      `I appreciate the swift reply. Just to add some detail: I tried restarting the app, clearing cache, and using a different device — nothing worked. Your system was clearly experiencing issues. I look forward to your update.\n\n${c.customerName}`,
      `Thank you. I want to emphasize that I had my confirmation email and my booking number ready. The issue was entirely on your end. Please resolve this quickly.\n\n${firstName}`,
    ], seed + 1);

    if ((seed % 3) !== 2) {
      msgs.push(msg("customer", techFollowUp, pick([80, 120, 150], seed + 3), false));
    }

  } else if (c.refundReason === "weather") {
    const weatherReason = getWeatherReason(seed, c);
    const daysAhead = Math.round(c.refundTimingHours / 24);

    msgs.push(msg("customer", `${greeting}\n\n${weatherReason}\n\nBooking: ${c.bookingId} — ${c.experienceName} (in ${daysAhead} day${daysAhead !== 1 ? "s" : ""})\nRefund requested: ${fmt(c.refundAmount)}\n\nI wanted to raise this early so there's plenty of time to process. Please let me know if there is a weather cancellation policy that applies.\n\nThank you,\n${c.customerName}`, 0));

    const weatherResponse = `Dear ${c.customerName},\n\nThank you for reaching out ahead of your experience.\n\nWe understand your concern about the weather forecast. Our team monitors conditions closely for outdoor experiences. Your request for a refund under weather-related circumstances is currently under review.\n\nWe will monitor the forecast and get back to you at least 24 hours before your experience date with a decision. In some cases, we may be able to offer a reschedule instead of a refund.\n\nKind regards,\nHeadout Customer Support`;
    msgs.push(msg("agent", weatherResponse, pick([20, 30, 45], seed)));

    if ((seed % 3) === 0) {
      msgs.push(msg("customer", `Thank you for the update. I would actually prefer a refund over a reschedule, as I'm not sure of my availability on other dates. I appreciate your flexibility.\n\n${c.customerName}`, 90));
    }

  } else {
    const otherReason = getOtherReason(seed, c);
    msgs.push(msg("customer", `${greeting}\n\n${otherReason}\n\nBooking details:\n- Booking ID: ${c.bookingId}\n- Experience: ${c.experienceName}\n- Refund amount: ${fmt(c.refundAmount)}\n\nPlease process this at your earliest convenience.\n\nThank you,\n${c.customerName}`, 0));

    msgs.push(msg("agent", getFirstAgentResponse(c, false), pick([25, 40, 55], seed)));

    if ((seed % 2) === 0) {
      msgs.push(msg("customer", `Thank you for the quick acknowledgment. I look forward to your decision. Please let me know if you need any further information from me.\n\n${firstName}`, 80, false));
    }
  }

  return msgs;
}

function getSubject(c: RefundCase): string {
  const reasonLabel: Record<string, string> = {
    no_show: "No-Show Refund",
    cancellation: "Cancellation & Refund Request",
    technical_issue: "Technical Issue — Refund Request",
    weather: "Weather Cancellation Request",
    other: "Refund Request",
  };
  return `${reasonLabel[c.refundReason] || "Refund Request"} — ${c.experienceName.split("—")[0].trim()} (${c.bookingId})`;
}

function getChannel(c: RefundCase): "email" | "chat" | "portal" {
  const h = caseHash(c.id);
  const channels: ("email" | "chat" | "portal")[] = ["email", "email", "email", "chat", "portal"];
  return pick(channels, h + 7);
}

function getPriority(c: RefundCase): "low" | "medium" | "high" | "urgent" {
  const score = c.riskAssessment?.totalScore ?? 0;
  const isHighValue = c.refundAmount >= 500;
  const isUrgent = Math.abs(c.refundTimingHours) < 12;

  if (isUrgent || (isHighValue && score >= 70)) return "urgent";
  if (score >= 60 || isHighValue) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function getTicketId(caseId: string): string {
  const num = caseId.replace("RC-", "");
  const h = caseHash(caseId) % 90000 + 10000;
  return `TKT-${h}`;
}

export function getTicketForCase(c: RefundCase): SupportTicket {
  return {
    caseId: c.id,
    ticketId: getTicketId(c.id),
    subject: getSubject(c),
    channel: getChannel(c),
    priority: getPriority(c),
    createdAt: c.requestDate,
    messages: buildMessages(c),
  };
}

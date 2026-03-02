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

/* ── Seeded pseudo-random helpers ──────────────────────────────── */

function caseHash(caseId: string): number {
  let h = 0;
  for (let i = 0; i < caseId.length; i++) h = (h * 31 + caseId.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function addMins(iso: string, mins: number): string {
  return new Date(new Date(iso).getTime() + mins * 60_000).toISOString();
}

function fmt(n: number): string {
  return `$${n.toLocaleString()}`;
}

function refId(caseId: string): string {
  return `REF-${Math.abs(caseHash(caseId) * 7919) % 900000 + 100000}`;
}

/* ── Subject & metadata ─────────────────────────────────────────── */

function getSubject(c: RefundCase): string {
  const label: Record<string, string> = {
    no_show: "No-Show Refund Request",
    cancellation: "Cancellation & Refund Request",
    technical_issue: "Technical Issue — Refund Request",
    weather: "Weather Cancellation Request",
    other: "Refund Request",
  };
  const exp = c.experienceName.split("—")[0].trim().split("–")[0].trim();
  return `${label[c.refundReason] || "Refund Request"} — ${exp} (${c.bookingId})`;
}

function getChannel(c: RefundCase): "email" | "chat" | "portal" {
  return pick(["email", "email", "email", "chat", "portal"] as const, caseHash(c.id) + 7);
}

function getPriority(c: RefundCase): "low" | "medium" | "high" | "urgent" {
  const score = c.riskAssessment?.totalScore ?? 0;
  if (c.status === "auto_approved") return pick(["low", "low", "medium"] as const, caseHash(c.id));
  if (Math.abs(c.refundTimingHours) < 12 || (c.refundAmount >= 500 && score >= 70)) return "urgent";
  if (score >= 60 || c.refundAmount >= 500) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function getTicketId(c: RefundCase): string {
  const h = (Math.abs(caseHash(c.id) * 6271)) % 90000 + 10000;
  return `TKT-${h}`;
}

/* ── Per-reason customer message bodies ────────────────────────── */

function noShowExcuse(seed: number, c: RefundCase): string {
  const excuses = [
    `I had a family emergency that prevented me from attending. The situation arose without warning and I had no way to reach out in advance.`,
    `A critical work meeting ran far over schedule and I simply couldn't leave in time to make it to the venue.`,
    `I woke up with a severe migraine this morning and was in no condition to travel or participate in any activity.`,
    `There was a major transit disruption in my area — the subway lines were suspended and there were no alternative options available.`,
    `An urgent personal matter involving a close family member required my immediate attention and I was unable to attend.`,
    `My connecting flight was cancelled due to mechanical issues, leaving me stranded at the airport well past the experience start time.`,
  ];
  return pick(excuses, seed);
}

function cancellationReason(seed: number, c: RefundCase): string {
  const isUrgent = c.refundTimingHours < 24;
  const urgent = [
    `I need to cancel urgently — an unexpected business emergency has come up that requires my immediate presence elsewhere today.`,
    `Something urgent has come up and I cannot attend this experience today. I know this is very short notice and I sincerely apologize.`,
    `I need to cancel my booking as soon as possible. I am dealing with a last-minute situation completely out of my control.`,
  ];
  const normal = [
    `My schedule has changed unexpectedly and I have a prior commitment that now conflicts with this booking.`,
    `My travel plans have changed and I am no longer able to be in the city for this experience.`,
    `A family obligation has come up that takes priority. I won't be able to attend and am requesting a cancellation.`,
    `My employer has asked me to travel for work on the same day — I have no flexibility over this and cannot rearrange the date.`,
    `The other people in my group can no longer join, and I would prefer not to attend alone. I'd like to cancel the full booking.`,
    `I am recovering from a minor procedure and my doctor has advised me to rest for the next several days.`,
  ];
  return isUrgent ? pick(urgent, seed) : pick(normal, seed);
}

function techExcuse(seed: number, c: RefundCase): string {
  const issues = [
    `When I arrived at the venue, the app showed "Booking not found" even though I had a valid confirmation email. The staff could not verify my booking and I was turned away.`,
    `The QR code in my confirmation email refused to load. I tried multiple times, restarted the app, and switched to mobile data — nothing worked. The venue had no manual process available.`,
    `The Headout app kept crashing every time I attempted to open my ticket at the venue entrance. After 20 minutes of troubleshooting the session had started and I had missed the beginning.`,
    `I received a "Ticket Invalid" error at the gate — the scanner rejected my code three times. A staff member checked and said my booking appeared "unconfirmed" on their system.`,
    `My ticket simply didn't load on the day of the event. Every time I navigated to "My Bookings" I saw a blank screen. There was no way for me to prove my booking at the venue.`,
    `The confirmation link in my email led to a 404 page on the day of the experience. Without access to my digital ticket the venue could not admit me.`,
  ];
  return pick(issues, seed);
}

function weatherReason(seed: number, c: RefundCase): string {
  const days = Math.round(c.refundTimingHours / 24);
  const reasons = [
    `I'm contacting you ahead of my booking because the forecast for that day looks very concerning. Heavy rain and strong winds are predicted, which would make this outdoor experience uncomfortable and potentially unsafe.`,
    `The weather forecast is showing severe thunderstorms on the day of my booking. As this is an outdoor experience I don't feel it would be safe or enjoyable to proceed.`,
    `I've been monitoring the forecast and conditions look very poor — extreme heat is predicted that would make participation difficult. I'd like to cancel in advance.`,
    `A storm advisory has been issued for the area. I don't feel comfortable attending an outdoor event under those conditions and would like a refund.`,
    `The forecast is showing an unexpected cold snap and possible ice for the day of my booking. It wouldn't be practical or safe to attend an outdoor experience under those conditions.`,
  ];
  return pick(reasons, seed);
}

function otherReason(seed: number): string {
  const reasons = [
    `My circumstances have changed in a way I wasn't able to anticipate, and attending is no longer feasible for me.`,
    `I'm dealing with a personal situation that makes attending impossible at this time. I'd prefer not to go into further detail.`,
    `I have a genuine reason for cancelling and would prefer to keep the details private. I've been a loyal customer and trust you'll accommodate this request.`,
    `Without going into extensive detail — I simply am no longer in a position to attend this experience.`,
  ];
  return pick(reasons, seed);
}

/* ── Build messages ─────────────────────────────────────────────── */

function buildMessages(c: RefundCase): TicketMessage[] {
  const seed = caseHash(c.id);
  const subject = getSubject(c);
  const msgs: TicketMessage[] = [];
  let idx = 0;

  function addMsg(
    role: "customer" | "agent" | "system",
    body: string,
    offsetMins: number,
    read = true
  ): void {
    idx++;
    msgs.push({
      id: `msg-${c.id}-${idx}`,
      from: role === "customer" ? c.customerName : role === "agent" ? "Headout Support" : "System",
      fromEmail: role === "customer" ? c.customerEmail : role === "system" ? "system@headout.com" : "support@headout.com",
      fromRole: role,
      to: role === "customer" ? "support@headout.com" : c.customerEmail,
      subject: role === "customer" ? subject : `Re: ${subject}`,
      body,
      timestamp: addMins(c.requestDate, offsetMins),
      isRead: role !== "customer" ? true : read,
    });
  }

  const firstName = c.customerName.split(" ")[0];
  const greetings = ["Hi,", "Hello,", "Dear Support Team,", "Dear Headout Team,", "Hi Support,", "Hello there,"];
  const g = pick(greetings, seed + 2);

  /* ── AUTO-APPROVED: automated system flow ── */
  if (c.status === "auto_approved") {
    const autoReasons: Record<string, string> = {
      cancellation: cancellationReason(seed, c),
      weather: weatherReason(seed, c),
      other: otherReason(seed),
      no_show: noShowExcuse(seed, c),
      technical_issue: techExcuse(seed, c),
    };
    const reason = autoReasons[c.refundReason] || otherReason(seed);

    addMsg("customer",
      `${g}\n\nI'd like to request a refund for my upcoming booking.\n\nBooking: ${c.bookingId} — ${c.experienceName}\nAmount: ${fmt(c.refundAmount)}\n\nReason: ${reason}\n\nPlease let me know if you need anything further.\n\nBest,\n${c.customerName}`,
      0
    );

    addMsg("system",
      `Automated review initiated — Risk Score: ${c.riskAssessment?.totalScore ?? 0} · Category: Auto-Approve`,
      2
    );

    addMsg("agent",
      `Hi ${firstName},\n\nThank you for submitting your refund request.\n\nGood news — our automated review system has assessed your case and approved your refund immediately.\n\n• Refund amount: ${fmt(c.refundAmount)}\n• Reference: ${refId(c.id)}\n• Processing time: 3–5 business days\n• Refund method: Original payment method\n\nNo further action is required from your end. You'll receive a separate confirmation email once the refund is processed.\n\nWe hope to welcome you back for another great experience soon.\n\nKind regards,\nHeadout Automated Support`,
      3
    );

    addMsg("system",
      `Refund ${refId(c.id)} processed · ${fmt(c.refundAmount)} · 3–5 business days`,
      4
    );

    return msgs;
  }

  /* ── NO-SHOW ── */
  if (c.refundReason === "no_show") {
    const excuse = noShowExcuse(seed, c);
    const tenureNote = c.customerTenureMonths >= 24
      ? `\n\nFor context, I've been a Headout customer for over ${Math.floor(c.customerTenureMonths / 12)} years and this kind of situation is very unlike me.`
      : c.customerTenureMonths >= 12
      ? `\n\nI've been using Headout for over a year and this is out of character for me.`
      : "";

    addMsg("customer",
      `${g}\n\n${excuse}\n\nI'm requesting a full refund of ${fmt(c.refundAmount)} for my booking:\n• Experience: ${c.experienceName}\n• Booking ID: ${c.bookingId}${tenureNote}\n\nPlease let me know what additional information you need.\n\nBest regards,\n${c.customerName}`,
      0
    );

    const isHighValue = c.refundAmount >= 500;
    if (isHighValue) {
      addMsg("agent",
        `Dear ${c.customerName},\n\nThank you for reaching out. We've received your refund request for booking ${c.bookingId} (${c.experienceName} — ${fmt(c.refundAmount)}).\n\nGiven the value of this booking, your case is being reviewed by our senior support team under our high-value experience policy. You can expect a response within 2 hours.\n\nKind regards,\nHeadout VIP Support Team`,
        pick([25, 35, 45], seed)
      );
    } else {
      addMsg("agent",
        pick([
          `Dear ${c.customerName},\n\nThank you for contacting Headout Support. We've received your refund request for booking ${c.bookingId}.\n\nWe understand emergencies happen. Your request is currently under review and we aim to get back to you within 24 hours. If you have any supporting documentation, feel free to attach it.\n\nKind regards,\nHeadout Customer Support`,
          `Hi ${firstName},\n\nThank you for getting in touch. We've received your refund request for booking ${c.bookingId} — ${c.experienceName}.\n\nOur team is looking into this now and will be in touch shortly.\n\nBest,\nHeadout Support`,
        ], seed + 3),
        pick([20, 30, 45, 60], seed)
      );
    }

    const followUps = [
      `I don't have formal documentation to share, but I hope you can accommodate this given my history as a customer. The ${fmt(c.refundAmount)} refund would mean a lot right now.\n\n${firstName}`,
      `Just checking in — is there any update on my case? I submitted this ${c.refundTimingHours < -6 ? "several hours" : "earlier"} and haven't heard anything further.\n\n${c.customerName}`,
      `I want to reiterate that this was a genuine emergency and not something I take lightly. I value Headout as a platform and hope you can process this refund.\n\n${firstName}`,
      `Could you share an expected timeline? ${fmt(c.refundAmount)} is a significant amount for me and I'd appreciate knowing when to expect a decision.\n\n${c.customerName}`,
    ];
    if ((seed % 3) !== 0) {
      addMsg("customer", pick(followUps, seed + 5), pick([90, 120, 180, 240], seed + 4), (seed % 5) !== 0);
    }

    const isSerial = c.refundCountLast6Months >= 10 || c.totalRefundCount >= 15;
    if (isSerial) {
      addMsg("agent",
        `Dear ${c.customerName},\n\nThank you for your follow-up. We want to assure you that your case is receiving careful and thorough attention.\n\nOur review process includes examining your full account history alongside the circumstances you've described. We'll share a decision as soon as it's ready.\n\nThank you for your patience.\n\nHeadout Customer Support`,
        pick([280, 320, 360], seed)
      );
    }

    return msgs;
  }

  /* ── CANCELLATION ── */
  if (c.refundReason === "cancellation") {
    const reason = cancellationReason(seed, c);
    const isUrgent = c.refundTimingHours < 24;
    const isHighValue = c.refundAmount >= 500;

    addMsg("customer",
      `${g}\n\n${reason}\n\nBooking details:\n• Booking ID: ${c.bookingId}\n• Experience: ${c.experienceName}\n• Refund: ${fmt(c.refundAmount)}\n\n${isUrgent ? "This is time-sensitive — the experience is today. Please process this urgently." : "I'd appreciate confirmation once this has been processed."}\n\nThank you,\n${c.customerName}`,
      0
    );

    if (isHighValue) {
      addMsg("agent",
        `Dear ${c.customerName},\n\nThank you for reaching out. We've received your cancellation request for booking ${c.bookingId} (${c.experienceName}).\n\nGiven the value of this booking (${fmt(c.refundAmount)}), this case is being reviewed by our senior team under our high-value cancellation policy. You can expect a response within 2 hours.\n\nWe appreciate your understanding.\n\nKind regards,\nHeadout VIP Support Team`,
        30
      );
      if ((seed % 2) === 0) {
        addMsg("customer",
          `Thank you for the prompt response. I understand a review is needed. Please do expedite this — ${isUrgent ? "the experience is in just a few hours" : "I need clarity on this soon"}.\n\n${firstName}`,
          55
        );
      }
    } else {
      addMsg("agent",
        pick([
          `Dear ${c.customerName},\n\nThank you for contacting us. We've received your cancellation request for booking ${c.bookingId}.\n\nYour case is under review. We'll be in touch with a decision within 24 hours.\n\nBest regards,\nHeadout Customer Support`,
          `Hi ${firstName},\n\nWe've received your request to cancel booking ${c.bookingId} — ${c.experienceName}.\n\nOur team is reviewing this now. We aim to respond within 24 hours.\n\nHeadout Support`,
        ], seed + 3),
        pick([15, 25, 40, 60], seed)
      );
      if (isUrgent && (seed % 2) === 0) {
        addMsg("customer",
          `I appreciate the quick reply. Is there any way to get a decision sooner? The experience is in just a few hours and I need to make arrangements.\n\n${firstName}`,
          pick([60, 75, 90], seed),
          false
        );
      }
    }

    return msgs;
  }

  /* ── TECHNICAL ISSUE ── */
  if (c.refundReason === "technical_issue") {
    const issue = techExcuse(seed, c);
    const engNote = c.emailEngagement === "opened"
      ? `\n\nI understand you may have records showing email activity on my account. To be clear — that was simply me attempting to access my ticket, not me attending the experience.`
      : "";

    addMsg("customer",
      `${g}\n\nI'm writing to report a technical failure that prevented me from attending "${c.experienceName}" (Booking: ${c.bookingId}).\n\n${issue}${engNote}\n\nThis is entirely a technical failure on Headout's part. I am requesting a full refund of ${fmt(c.refundAmount)}. This was supposed to be a special outing and I am very disappointed.\n\nRegards,\n${c.customerName}`,
      0
    );

    addMsg("agent",
      `Dear ${c.customerName},\n\nWe're sorry to hear about the difficulties you experienced with booking ${c.bookingId}.\n\nWe take technical issues very seriously. Your case has been escalated to our technical team for investigation. They will review the system logs for your account and the venue check-in records. We will provide a full update within 4 hours.\n\nWe sincerely apologise for the inconvenience.\n\nHeadout Support Team`,
      pick([20, 30, 45], seed)
    );

    const techFollowUps = [
      `Thank you for the response. I'll await the technical team's findings. Just to add — I was at the venue at exactly the right time. Please check with the venue staff who can confirm I was there.\n\n${firstName}`,
      `I appreciate the quick reply. For extra detail: I tried restarting the app, clearing the cache, and using a different device — none of it worked. The issue was clearly on your platform's end.\n\n${c.customerName}`,
      `Thank you. I had my booking confirmation printed and on my phone. The problem was entirely with your system. I look forward to the technical team's findings.\n\n${firstName}`,
    ];
    if ((seed % 3) !== 2) {
      addMsg("customer", pick(techFollowUps, seed + 1), pick([70, 100, 130], seed + 3), false);
    }

    return msgs;
  }

  /* ── WEATHER ── */
  if (c.refundReason === "weather") {
    const reason = weatherReason(seed, c);
    const daysAway = Math.round(c.refundTimingHours / 24);

    addMsg("customer",
      `${g}\n\n${reason}\n\nBooking details:\n• Booking ID: ${c.bookingId}\n• Experience: ${c.experienceName} (in ${daysAway} day${daysAway !== 1 ? "s" : ""})\n• Refund requested: ${fmt(c.refundAmount)}\n\nI wanted to flag this early so there's time to process. Does your weather cancellation policy cover this?\n\nThank you,\n${c.customerName}`,
      0
    );

    addMsg("agent",
      `Dear ${c.customerName},\n\nThank you for reaching out ahead of your experience.\n\nWe understand the concern about the forecast. Our team monitors conditions for outdoor experiences closely and will take this into consideration. Your request is under review — we will get back to you at least 24 hours before your experience date.\n\nIn some cases, we can offer a reschedule rather than a refund. We'll discuss options with you shortly.\n\nKind regards,\nHeadout Customer Support`,
      pick([20, 30, 45], seed)
    );

    if ((seed % 3) === 0) {
      addMsg("customer",
        `Thank you for the update. I would prefer a full refund rather than a reschedule, as I'm not sure of my availability on other dates. Please do keep me posted.\n\n${c.customerName}`,
        90
      );
    }

    return msgs;
  }

  /* ── OTHER / FALLBACK ── */
  const reason = otherReason(seed);
  addMsg("customer",
    `${g}\n\nI'd like to request a refund for my booking.\n\n${reason}\n\nBooking details:\n• Booking ID: ${c.bookingId}\n• Experience: ${c.experienceName}\n• Refund: ${fmt(c.refundAmount)}\n\nPlease process this at your earliest convenience.\n\nThank you,\n${c.customerName}`,
    0
  );

  addMsg("agent",
    pick([
      `Dear ${c.customerName},\n\nThank you for reaching out. We've received your refund request for booking ${c.bookingId}.\n\nYour case is under review and we aim to respond within 24 hours.\n\nBest regards,\nHeadout Customer Support`,
      `Hi ${firstName},\n\nWe've received your request regarding booking ${c.bookingId} — ${c.experienceName}.\n\nOur team is looking into this now. We'll update you shortly.\n\nHeadout Support`,
    ], seed + 3),
    pick([20, 35, 50], seed)
  );

  if ((seed % 2) === 0) {
    addMsg("customer",
      `Thank you for the acknowledgment. Please let me know if you need any further information from me to process this request.\n\n${firstName}`,
      pick([70, 90, 110], seed),
      false
    );
  }

  return msgs;
}

/* ── Public export ──────────────────────────────────────────────── */

export function getTicketForCase(c: RefundCase): SupportTicket {
  return {
    caseId: c.id,
    ticketId: getTicketId(c),
    subject: getSubject(c),
    channel: getChannel(c),
    priority: getPriority(c),
    createdAt: c.requestDate,
    messages: buildMessages(c),
  };
}

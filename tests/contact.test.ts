jest.mock("server-only", () => ({}), { virtual: true });

type SentMail = { to: string; subject: string; body: string; replyTo?: string };

const sendMail = jest.fn<Promise<void>, [SentMail]>(async () => {});

jest.mock("@/services/email/graph", () => ({
  sendMail: (options: SentMail) => sendMail(options),
  isTransientMailError: () => false,
}));

import {
  ContactValidationError,
  SUPPORT_INBOX,
  assertValidContactMessage,
  buildContactEmailHtml,
  sendContactMessage,
} from "@/services/contact/message";

const valid = {
  name: "Ayesha Khan",
  email: "Ayesha@student.nust.edu.pk",
  message: "Where do I collect my orientation kit?",
};

describe("contact message validation", () => {
  it("trims input and lowercases the email", () => {
    const result = assertValidContactMessage({
      name: "  Ayesha Khan  ",
      email: "  Ayesha@Student.NUST.edu.pk ",
      message: "  Where do I collect my orientation kit?  ",
    });

    expect(result.name).toBe("Ayesha Khan");
    expect(result.email).toBe("ayesha@student.nust.edu.pk");
    expect(result.message).toBe("Where do I collect my orientation kit?");
  });

  it.each([
    ["a blank name", { ...valid, name: "   " }],
    ["an over-long name", { ...valid, name: "a".repeat(121) }],
    ["a malformed email", { ...valid, email: "not-an-email" }],
    ["a too-short message", { ...valid, message: "hi" }],
    ["an over-long message", { ...valid, message: "a".repeat(4001) }],
  ])("rejects %s", (_label, input) => {
    expect(() => assertValidContactMessage(input)).toThrow(ContactValidationError);
  });
});

describe("contact email body", () => {
  it("escapes HTML so a visitor cannot inject markup", () => {
    const html = buildContactEmailHtml({
      name: '<img src=x onerror="alert(1)">',
      email: "visitor@example.com",
      message: "<script>alert(1)</script>",
    });

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("keeps line breaks from the textarea", () => {
    const html = buildContactEmailHtml({ ...valid, message: "line one\nline two" });

    expect(html).toContain("line one<br />line two");
  });
});

describe("sendContactMessage", () => {
  it("mails support and points replies at the visitor", async () => {
    await sendContactMessage(valid);

    expect(sendMail).toHaveBeenCalledTimes(1);
    const options = sendMail.mock.calls[0][0];

    expect(options.to).toBe(SUPPORT_INBOX);
    expect(options.replyTo).toBe("ayesha@student.nust.edu.pk");
    expect(options.subject).toContain("Ayesha Khan");
    expect(options.body).toContain("orientation kit");
  });

  it("collapses newlines so the subject cannot carry injected headers", async () => {
    await sendContactMessage({ ...valid, name: "Ayesha\nBcc: victim@example.com" });

    const options = sendMail.mock.calls[0][0];

    expect(options.subject).not.toContain("\n");
  });

  it("does not send when validation fails", async () => {
    await expect(sendContactMessage({ ...valid, email: "nope" })).rejects.toBeInstanceOf(
      ContactValidationError
    );
    expect(sendMail).not.toHaveBeenCalled();
  });
});

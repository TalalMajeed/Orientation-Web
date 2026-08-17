import {
  EMAIL_PATTERN,
  extractPlaceholders,
  normalizeColumnName,
  normalizeColumnNames,
  renderBodyHtml,
  renderBodyText,
  renderSubject,
  unknownPlaceholders,
} from "@/services/email/template";

describe("column normalization", () => {
  it.each([
    ["Name", "name"],
    ["Contact Number", "contact_number"],
    ["Email ID", "email_id"],
    ["CMS ID", "cms_id"],
    ["Hostellite/ Day Scholar", "hostellite_day_scholar"],
    ["OG House ", "og_house"],
    ["  Merit  %  ", "merit"],
    ["e-mail", "email"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeColumnName(input)).toBe(expected);
  });

  it("fills blank headers and de-duplicates collisions", () => {
    expect(normalizeColumnNames(["Email ID", "", "email id", "Email-ID", "!!"])).toEqual([
      "email_id",
      "column_2",
      "email_id_2",
      "emailid",
      "column_5",
    ]);
  });
});

describe("templating", () => {
  const values = { name: "Amal Imdad", og_house: "Khiljis" };

  it("substitutes known placeholders", () => {
    expect(renderBodyText("Hi {name}, welcome to {og_house}.", values)).toBe(
      "Hi Amal Imdad, welcome to Khiljis."
    );
  });

  it("renders unknown placeholders as empty strings", () => {
    expect(renderBodyText("Hi {nickname}.", values)).toBe("Hi .");
    expect(unknownPlaceholders("Hi {nickname} {name}.", ["name"])).toEqual(["nickname"]);
  });

  it("collapses the subject onto one header-safe line", () => {
    expect(renderSubject("  Welcome\n{name}  ", values)).toBe("Welcome Amal Imdad");
  });

  it("escapes both the template and the substituted values", () => {
    const html = renderBodyHtml("<b>{name}</b>\nBye", { name: "<script>x</script>" });

    expect(html).toContain("&lt;b&gt;");
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("<br />");
  });

  it("lists each placeholder once, in order", () => {
    expect(extractPlaceholders("{a} {b} {a}")).toEqual(["a", "b"]);
  });
});

describe("email pattern", () => {
  it.each(["amalimdad05@gmail.com", "info@orientation.nust.edu.pk"])("accepts %s", (email) => {
    expect(EMAIL_PATTERN.test(email)).toBe(true);
  });

  it.each(["Amal Imdad", "", "no-at-sign.com", "two@@dots.com"])("rejects %s", (email) => {
    expect(EMAIL_PATTERN.test(email)).toBe(false);
  });
});

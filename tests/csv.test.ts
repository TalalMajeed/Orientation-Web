import { parseCsv, parseRosterCsv, toCsv } from "@/services/tickets/csv";

describe("parseCsv", () => {
  it("reads quoted fields containing commas and newlines", () => {
    const table = parseCsv('a,"b,c","d\ne"\n1,2,3\n');

    expect(table).toEqual([
      ["a", "b,c", "d\ne"],
      ["1", "2", "3"],
    ]);
  });

  it("unescapes doubled quotes", () => {
    expect(parseCsv('"say ""hi""",x')).toEqual([['say "hi"', "x"]]);
  });

  it("handles CRLF line endings and a trailing newline", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("strips the BOM Excel prepends", () => {
    expect(parseCsv("﻿name,email\n")).toEqual([["name", "email"]]);
  });
});

describe("parseRosterCsv", () => {
  it("accepts columns in any order and normalises emails", () => {
    const { rows, problems } = parseRosterCsv(
      "Email,Name\n  ALI@nust.edu.pk , Ali Khan \n"
    );

    expect(problems).toEqual([]);
    expect(rows).toEqual([
      { line: 2, name: "Ali Khan", email: "ali@nust.edu.pk" },
    ]);
  });

  it("rejects a file without the required headers", () => {
    const { rows, problems } = parseRosterCsv("full name,mail\nAli,a@b.pk\n");

    expect(rows).toEqual([]);
    expect(problems[0].message).toContain("must contain");
  });

  it("reports bad rows by line number and keeps the good ones", () => {
    const { rows, problems } = parseRosterCsv(
      [
        "name,email",
        "Ali Khan,ali@nust.edu.pk",
        ",orphan@nust.edu.pk",
        "No Email,",
        "Bad Email,not-an-email",
        "Sara Ahmed,sara@nust.edu.pk",
      ].join("\n")
    );

    expect(rows.map((row) => row.email)).toEqual([
      "ali@nust.edu.pk",
      "sara@nust.edu.pk",
    ]);
    expect(problems.map((problem) => problem.line)).toEqual([3, 4, 5]);
  });

  it("catches duplicates within the file before they reach the index", () => {
    const { rows, problems } = parseRosterCsv(
      "name,email\nAli,ali@nust.edu.pk\nAli Again,ALI@nust.edu.pk\n"
    );

    expect(rows).toHaveLength(1);
    expect(problems[0].message).toContain("Duplicate");
  });

  it("skips blank lines", () => {
    const { rows, problems } = parseRosterCsv(
      "name,email\nAli,ali@nust.edu.pk\n\n\n"
    );

    expect(rows).toHaveLength(1);
    expect(problems).toEqual([]);
  });
});

describe("toCsv", () => {
  it("quotes cells containing separators or quotes", () => {
    expect(toCsv(["a", "b"], [['x,y', 'he said "no"']])).toBe(
      'a,b\r\n"x,y","he said ""no"""'
    );
  });
});

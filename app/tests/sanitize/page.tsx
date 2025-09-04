import { sanitizeText, sanitizeStringArray } from "@/lib/utils";

type Case = { name: string; input: string; expected: string };

export default function SanitizeTestPage() {
  const cases: Case[] = [
    {
      name: "Strips script tags",
      input: "<script>alert('xss')</script>Hello",
      expected: "Hello",
    },
    {
      name: "Removes onerror attribute payload",
      input: '<img src=x onerror=alert(1)>Title',
      expected: "Title",
    },
    {
      name: "Trims whitespace and control chars",
      input: "\u0000  Clean  \u0007",
      expected: "Clean",
    },
    {
      name: "Removes javascript: protocol",
      input: "javascript:alert(1)Click",
      expected: "Click",
    },
    {
      name: "Removes data: protocol",
      input: "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==Text",
      expected: "Text",
    },
    {
      name: "Plain text preserved",
      input: "Safe Title",
      expected: "Safe Title",
    },
  ];

  const arrayInput = [
    "<b>Bold</b>",
    "  Option ",
    "javascript:evil()Two",
    "",
    "<img src=x onerror=alert(1)>Three",
  ];
  const arrayExpected = ["Bold", "Option", "Two", "Three"];

  const results = cases.map((c) => ({
    name: c.name,
    input: c.input,
    expected: c.expected,
    actual: sanitizeText(c.input),
  }));

  const arrayActual = sanitizeStringArray(arrayInput);

  const passCount = results.filter((r) => r.actual === r.expected).length;
  const allPass = passCount === results.length &&
    arrayActual.length === arrayExpected.length &&
    arrayActual.every((v, i) => v === arrayExpected[i]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <h1 className="text-2xl font-semibold">Sanitization Tests</h1>
      <div className={allPass ? "text-green-600" : "text-red-600"}>
        Overall: {allPass ? "PASS" : "FAIL"}
      </div>

      <div className="space-y-4">
        {results.map((r) => {
          const ok = r.actual === r.expected;
          return (
            <div key={r.name} className="border rounded p-3">
              <div className="font-medium">{r.name}</div>
              <div className="text-sm text-slate-600">Input: {JSON.stringify(r.input)}</div>
              <div className="text-sm">Expected: {JSON.stringify(r.expected)}</div>
              <div className="text-sm">Actual: {JSON.stringify(r.actual)}</div>
              <div className={ok ? "text-green-600" : "text-red-600"}>{ok ? "PASS" : "FAIL"}</div>
            </div>
          );
        })}
      </div>

      <div className="border rounded p-3">
        <div className="font-medium">sanitizeStringArray</div>
        <div className="text-sm text-slate-600">Input: {JSON.stringify(arrayInput)}</div>
        <div className="text-sm">Expected: {JSON.stringify(arrayExpected)}</div>
        <div className="text-sm">Actual: {JSON.stringify(arrayActual)}</div>
        <div className={arrayActual.length === arrayExpected.length && arrayActual.every((v, i) => v === arrayExpected[i]) ? "text-green-600" : "text-red-600"}>
          {arrayActual.length === arrayExpected.length && arrayActual.every((v, i) => v === arrayExpected[i]) ? "PASS" : "FAIL"}
        </div>
      </div>
    </div>
  );
}



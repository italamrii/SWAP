import { Fragment } from "react";

// A run of Latin words/numbers (e.g. "RTX 4070 Super", "4080 Super", "DDR5 6000MHz").
const LATIN_RUN = /([A-Za-z0-9][A-Za-z0-9.+\-_/#%°×]*(?:[  ][A-Za-z0-9][A-Za-z0-9.+\-_/#%°×]*)*)/g;

/**
 * Isolates Latin model names inside Arabic text so mixed runs like
 * "ترقيت إلى 4080 Super" never render reversed ("Super 4080").
 */
export function BidiText({ text }: { text: string }) {
  const parts = text.split(LATIN_RUN);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 && /[A-Za-z]/.test(p) ? <bdi key={i} dir="ltr">{p}</bdi> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}

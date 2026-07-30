import { Fragment } from "react";

/**
 * Splits a string into per-word masks so a heading can cascade in.
 * The separating space must sit *outside* the mask — trailing whitespace inside
 * an overflow-hidden inline-block gets collapsed, and the words run together.
 */
export default function Words({ text, from = 0 }) {
  const words = text.split(" ");

  return words.map((word, index) => (
    <Fragment key={`${word}-${index}`}>
      <span className="w">
        <span className="w-in" style={{ "--wd": `${from + index * 42}ms` }}>
          {word}
        </span>
      </span>
      {index < words.length - 1 ? " " : null}
    </Fragment>
  ));
}

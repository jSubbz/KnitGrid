import { Fragment } from "react";

/**
 * Locale strings hold prose, and prose needs the odd bold word or bit of code.
 * Marking those up in the JSON keeps the translator working in one file rather
 * than hunting for the fragments a component split them into. Two markers is
 * the whole grammar: **bold** and `code`.
 */
export default function RichText({ children }: { children: string }) {
  const parts = children.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <b key={index}>{part.slice(2, -2)}</b>;
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return <code key={index}>{part.slice(1, -1)}</code>;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

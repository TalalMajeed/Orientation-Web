import { renderToStaticMarkup } from "react-dom/server";

describe("smoke test", () => {
  it("renders a basic TSX element", () => {
    const markup = renderToStaticMarkup(<main>Orientation Web</main>);

    expect(markup).toContain("Orientation Web");
    expect(markup).toContain("main");
  });
});
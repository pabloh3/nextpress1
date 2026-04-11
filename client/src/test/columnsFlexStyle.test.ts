import { describe, it, expect } from "vitest";
import {
  buildFlexRowColumnStyle,
  parsePlainPercentWidth,
} from "@shared/columns-flex-style";

describe("parsePlainPercentWidth", () => {
  it("parses simple percentages", () => {
    expect(parsePlainPercentWidth("33.33%")).toBe(33.33);
    expect(parsePlainPercentWidth("50 %")).toBe(50);
    expect(parsePlainPercentWidth("100%")).toBe(100);
  });

  it("returns null for non-plain values", () => {
    expect(parsePlainPercentWidth("calc(50% - 10px)")).toBeNull();
    expect(parsePlainPercentWidth("50vw")).toBeNull();
    expect(parsePlainPercentWidth("1fr")).toBeNull();
  });
});

describe("buildFlexRowColumnStyle gap-aware %", () => {
  it("uses calc for plain % when multiple columns and gap", () => {
    const style = buildFlexRowColumnStyle("33.33%", "220px", {
      gap: "20px",
      columnCount: 3,
    });
    expect(style.width).toBe("calc((100% - 2 * (20px)) * 0.3333)");
    expect(style.flex).toBe("1 1 auto");
  });

  it("uses calc for two 50% columns with one gap", () => {
    const style = buildFlexRowColumnStyle("50%", "0px", {
      gap: "18px",
      columnCount: 2,
    });
    expect(style.width).toBe("calc((100% - 1 * (18px)) * 0.5)");
  });

  it("leaves plain % when only one column", () => {
    const style = buildFlexRowColumnStyle("100%", "220px", {
      gap: "20px",
      columnCount: 1,
    });
    expect(style.width).toBe("100%");
  });

  it("leaves calc() widths untouched even with gap context", () => {
    const w = "calc(50% - 10px)";
    const style = buildFlexRowColumnStyle(w, "220px", {
      gap: "20px",
      columnCount: 2,
    });
    expect(style.width).toBe(w);
  });

  it("matches flex row defaults without gap context", () => {
    const style = buildFlexRowColumnStyle("40%", "220px");
    expect(style.width).toBe("40%");
  });
});

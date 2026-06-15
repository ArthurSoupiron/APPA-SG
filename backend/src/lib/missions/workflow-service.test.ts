import { describe, expect, test } from "bun:test";

import {
  computeBcDocStages,
  multiDocStatus,
  singleDocPresent,
  singleDocWithChainStatus,
} from "./workflow-service";

describe("multiDocStatus", () => {
  test("retourne absent pour count = 0", () => {
    expect(multiDocStatus(0)).toBe("absent");
  });

  test("retourne present pour count = 1", () => {
    expect(multiDocStatus(1)).toBe("present");
  });

  test("retourne avenant pour count > 1", () => {
    expect(multiDocStatus(2)).toBe("avenant");
    expect(multiDocStatus(5)).toBe("avenant");
  });
});

describe("singleDocWithChainStatus", () => {
  test("retourne absent si null", () => {
    expect(singleDocWithChainStatus(null)).toBe("absent");
  });

  test("retourne present si replacedById est null", () => {
    expect(singleDocWithChainStatus({ replacedById: null })).toBe("present");
    expect(singleDocWithChainStatus({})).toBe("present");
  });

  test("retourne avenant si replacedById est renseigné", () => {
    expect(singleDocWithChainStatus({ replacedById: "next-rmi-id" })).toBe("avenant");
  });
});

describe("singleDocPresent", () => {
  test("retourne absent si null", () => {
    expect(singleDocPresent(null)).toBe("absent");
  });

  test("retourne present si document existe", () => {
    expect(singleDocPresent({ id: "fa-1" })).toBe("present");
  });
});

describe("computeBcDocStages", () => {
  test("calcule les statuts pour un BC sans documents", () => {
    expect(
      computeBcDocStages({
        fa: null,
        fs: [],
        rmi: null,
        bv: [],
        pvrf: null,
        qs: null,
      }),
    ).toEqual({
      fa: "absent",
      fs: "absent",
      rmi: "absent",
      bv: "absent",
      pvrf: "absent",
      qs: "absent",
    });
  });

  test("calcule les statuts pour un BC complet sans avenant", () => {
    expect(
      computeBcDocStages({
        fa: { id: "fa-1" } as never,
        fs: [{ id: "fs-1" } as never],
        rmi: { id: "rmi-1", replacedById: null } as never,
        bv: [{ id: "bv-1" } as never],
        pvrf: { id: "pvrf-1" } as never,
        qs: { id: "qs-1" } as never,
      }),
    ).toEqual({
      fa: "present",
      fs: "present",
      rmi: "present",
      bv: "present",
      pvrf: "present",
      qs: "present",
    });
  });

  test("détecte les avenants FS, BV et RMI", () => {
    expect(
      computeBcDocStages({
        fa: { id: "fa-1" } as never,
        fs: [{ id: "fs-1" } as never, { id: "fs-2" } as never],
        rmi: { id: "rmi-1", replacedById: "rmi-2" } as never,
        bv: [{ id: "bv-1" } as never, { id: "bv-2" } as never],
        pvrf: null,
        qs: null,
      }),
    ).toEqual({
      fa: "present",
      fs: "avenant",
      rmi: "avenant",
      bv: "avenant",
      pvrf: "absent",
      qs: "absent",
    });
  });
});

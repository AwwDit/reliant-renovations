/**
 * Analytic drafting geometry in the approved logo's native 474 × 335 space.
 * Two smooth silhouettes describe the visible RR monogram only. This is a
 * construction study, not a replacement logo: the exact PNG resolves above it.
 */
export const rrProfiles = [
  {
    id: "left",
    path: "M77 11H203C232 11 251 30 251 61C251 87 239 105 215 112L260 161H201L158 115H118V161H77V74H198C206 74 211 69 211 62C211 55 206 51 198 51H77Z",
  },
  {
    id: "right",
    path: "M235 11H348C378 11 397 30 397 61C397 87 385 105 360 112L404 161H345L301 115H236C248 104 255 91 258 74H344C352 74 356 69 356 62C356 55 352 51 344 51H258C255 33 248 20 235 11Z",
  },
] as const;

export const rrDatums = [
  "M42 11H435M42 161H435",
  "M77 0V184M118 96V184M404 137V184",
  "M59 51H374M59 74H374",
] as const;

export const rrConstructionArcs = [
  "M177 10A55 55 0 1 1 176 113",
  "M321 10A55 55 0 1 1 321 113",
  "M184 51A14 14 0 1 1 184 74",
  "M330 51A14 14 0 1 1 330 74",
  "M201 62L235 24M194 62H208M201 55V69",
  "M346 62L380 24M339 62H353M346 55V69",
] as const;

/** Extension ticks and projection connectors refer only to the drawn mark. */
export const rrWitnesses = [
  "M52 0V174M47 6L57 16M47 156L57 166M61 11H46M61 161H46",
  "M77 179H404M72 184L82 174M399 184L409 174",
  "M77 11L85 19M77 161L85 169M118 161L126 169M260 161L268 169M404 161L412 169M397 61L405 69",
] as const;

#!/usr/bin/env node
// Validates specimen-001.json against the local mirror of
// verascore-evidence-schema-v0.1 using ajv. Run from this directory:
//   node validate.mjs
// or with a custom specimen path:
//   node validate.mjs ./other-specimen.json
//
// To validate against the upstream canonical schema once reachable:
//   curl -sS https://verascore.ai/schemas/verascore-evidence-schema-v0.1.json > schema.upstream.json
//   node validate.mjs ./specimen-001.json ./schema.upstream.json
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const here = dirname(fileURLToPath(import.meta.url));
const specimenPath = resolve(process.argv[2] || `${here}/specimen-001.json`);
const schemaPath = resolve(process.argv[3] || `${here}/verascore-evidence-schema-v0.1.local.json`);

const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const specimen = JSON.parse(readFileSync(specimenPath, "utf8"));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
const ok = validate(specimen);

const out = {
  schema_id: schema.$id,
  schema_path: schemaPath,
  specimen_path: specimenPath,
  valid: ok,
  errors: validate.errors || [],
  required_field_check: [
    "source",
    "evidence_type",
    "subject",
    "signals",
    "provenance",
    "timestamp_iso8601",
    "freshness_ttl_seconds"
  ].map((f) => ({ field: f, present: Object.prototype.hasOwnProperty.call(specimen, f) }))
};
console.log(JSON.stringify(out, null, 2));
process.exit(ok ? 0 : 1);

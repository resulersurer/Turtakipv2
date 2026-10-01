import test from "node:test";
import assert from "node:assert/strict";
import { migrationsMatch } from "./migration-state.mjs";
const local = [{name:"first",checksum:"a"},{name:"second",checksum:"b"}];
const applied = local.map((row)=>({migration_name:row.name,checksum:row.checksum,finished_at:new Date(),rolled_back_at:null}));
test("only fully applied, matching migrations can skip deploy",()=>{
 assert.equal(migrationsMatch(local,applied),true);
 assert.equal(migrationsMatch(local,applied.slice(0,1)),false);
 assert.equal(migrationsMatch(local,[{...applied[0],checksum:"changed"},applied[1]]),false);
 assert.equal(migrationsMatch(local,[applied[0],{...applied[1],finished_at:null}]),false);
 assert.equal(migrationsMatch(local,[applied[0],{...applied[1],rolled_back_at:new Date()}]),false);
});
test("an unfinished migration prevents skipping even if other rows match",()=>{
 assert.equal(migrationsMatch(local,[...applied,{migration_name:"unfinished",checksum:"c",finished_at:null,rolled_back_at:null}]),false);
});
test("a rolled back attempt followed by a completed retry is valid",()=>{
 assert.equal(migrationsMatch(local,[{...applied[1],finished_at:null,rolled_back_at:new Date()},...applied]),true);
});

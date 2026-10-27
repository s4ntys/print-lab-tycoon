import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
export function database(filename=':memory:'){
 const db=new DatabaseSync(filename);
 if(!db.prepare("SELECT name FROM sqlite_master WHERE name='players'").get())db.exec(fs.readFileSync('drizzle/0000_world.sql','utf8'));
 return {prepare(sql){return {bind(...args){return {async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}};},async all(){return {results:db.prepare(sql).all()};},async first(){return db.prepare(sql).get()||null;}};},raw:db};
}

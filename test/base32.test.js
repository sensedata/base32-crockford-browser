import assert from "assert";
import base32 from "../src/base32.js";

let encoded;
const encoder = new base32.Encoder();
const teststring = "lowercase UPPERCASE 1234567 !@#$%^&*";

encoded = base32.encode(teststring);
assert.equal(encoded, "dhqqesbjcdgq6s90an850haj8d0n6h9064s36d1n6rvj08a04cj2aqh658");
assert.equal(base32.decode(encoded), teststring);

encoded = encoder.update(teststring.slice(0, 10));
encoded += encoder.update(teststring.slice(10));
encoded += encoder.finish();
assert.equal(encoded, "dhqqesbjcdgq6s90an850haj8d0n6h9064s36d1n6rvj08a04cj2aqh658");

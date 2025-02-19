// This would be the place to edit if you want a different
// Base32 implementation

const ALPHABET = Object.freeze("0123456789abcdefghjkmnpqrstvwxyz");
const ALIAS = Object.freeze({o: 0, i: 1, l: 1});

/**
 * Build a lookup table and memoize it
 *
 * Return an object that maps a character to its
 * byte value.
 */

let lookup = () => {
  let table = {}
  // Invert "alphabet"
  for (let i = 0; i < ALPHABET.length; i++) {
    table[ALPHABET[i]] = i;
  }
  // Splice in "alias"
  for (let key in ALIAS) {
    if (!Object.prototype.hasOwnProperty.call(ALIAS, key)) {
      continue;
    }
    table[key] = table["" + ALIAS[key]];
  }
  Object.freeze(table);
  lookup = () => table;
  return table;
}

/**
 * A streaming encoder
 *
 *     var encoder = new base32.Encoder()
 *     var output1 = encoder.update(input1)
 *     var output2 = encoder.update(input2)
 *     var lastoutput = encode.update(lastinput, true)
 */

function Encoder() {
  var skip = 0; // how many bits we will skip from the first byte
  var bits = 0; // 5 high bits, carry from one byte to the next

  this.output = "";

  // Read one byte of input
  // Should not really be used except by "update"
  this.readByte = function (byte) {
    // coerce the byte to an int
    if (typeof byte == "string") {
      byte = byte.charCodeAt(0);
    }

    if (skip < 0) { // we have a carry from the previous byte
      bits |= (byte >> (-skip));
    } else { // no carry
      bits = (byte << skip) & 248;
    }

    if (skip > 3) {
      // not enough data to produce a character, get us another one
      skip -= 8;
      return 1;
    }

    if (skip < 4) {
      // produce a character
      this.output += ALPHABET[bits >> 3];
      skip += 5;
    }

    return 0;
  }

  // Flush any remaining bits left in the stream
  this.finish = function (check) {
    var output = this.output + (skip < 0 ? ALPHABET[bits >> 3] : "") + (check ? "$" : "");
    this.output = "";
    return output;
  }
}

/**
 * Process additional input
 *
 * input: string of bytes to convert
 * flush: boolean, should we flush any trailing bits left
 *        in the stream
 * returns: a string of characters representing "input" in base32
 */

Encoder.prototype.update = function (input, flush) {
  for (var i = 0; i < input.length;) {
    i += this.readByte(input[i]);
  }
  // consume all output
  let output = this.output;
  this.output = "";
  if (flush) {
    output += this.finish();
  }
  return output;
}

// Functions analogously to Encoder

function Decoder() {
  let skip = 0; // how many bits we have from the previous character
  let byte = 0; // current byte we"re producing
  let bits = 0;

  this.output = "";

  // Consume a character from the stream, store
  // the output in this.output. As before, better
  // to use update().
  this.readChar = function (char) {
    if (typeof char !== "string") {
      if (typeof char === "number") {
        char = String.fromCharCode(char);
      }
    }
    char = char.toLowerCase();
    let val = lookup()[char];
    if (typeof val === "undefined") {
      // character does not exist in our lookup table
      return // skip silently. An alternative would be:
      // throw Error("Could not find character "" + char + "" in lookup table.")
    }
    val <<= 3; // move to the high bits
    byte |= val >>> skip;
    skip += 5;
    if (skip >= 8) {
      // we have enough to preduce output
      this.output += String.fromCharCode(byte);
      skip -= 8;
      byte = (skip > 0) ? ((val << (5 - skip)) & 255) : 0;
    }
  }

  this.finish = function (check) {
    const output = this.output + (skip < 0 ? ALPHABET[bits >> 3] : "") + (check ? "$" : "");
    this.output = "";
    return output;
  }
}

Decoder.prototype.update = function (input, flush) {
  for (let i = 0; i < input.length; i++) {
    this.readChar(input[i]);
  }
  let output = this.output;
  this.output = "";
  if (flush) {
    output += this.finish();
  }
  return output;
}

/** Convenience functions
 *
 * These are the ones to use if you just have a string and
 * want to convert it without dealing with streams and whatnot.
 */

// String of data goes in, Base32-encoded string comes out.
function encode(input) {
  return new Encoder().update(input, true);
}

// Base32-encoded string goes in, decoded data comes out.
function decode(input) {
  return new Decoder().update(input, true);
}

export default {encode, decode, Encoder, Decoder};

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as assert from 'assert';
import * as Formatter from '../impl/format';
import { Range } from '../main';

suite('JSON - formatter', () => {

	function format(content: string, expected: string, insertSpaces = true, insertFinalNewline = false, keepLines = false, keyQuotes: undefined | 'none-single' | 'none-double' | 'single' | 'double' = undefined, stringQuotes: undefined | 'single' | 'double' = undefined, trailingCommas: undefined | 'none' | 'all' = undefined, startIgnoreDirective?: string, endIgnoreDirective?: string): void {
		let range: Range | undefined = void 0;
		const rangeStart = content.indexOf('|');
		const rangeEnd = content.lastIndexOf('|');
		if (rangeStart !== -1 && rangeEnd !== -1) {
			content = content.substring(0, rangeStart) + content.substring(rangeStart + 1, rangeEnd) + content.substring(rangeEnd + 1);
			range = { offset: rangeStart, length: rangeEnd - rangeStart };
		}

		const edits = Formatter.format(content, range, { tabSize: 2, insertSpaces, insertFinalNewline, eol: '\n', keepLines, keyQuotes, stringQuotes, trailingCommas, startIgnoreDirective, endIgnoreDirective });

		let lastEditOffset = content.length;

		for (let i = edits.length - 1; i >= 0; i--) {
			const edit = edits[i];
			// assert(edit.offset >= 0 && edit.length >= 0 && edit.offset + edit.length <= content.length);
			// assert(typeof edit.content === 'string');
			// assert(lastEditOffset >= edit.offset + edit.length); // make sure all edits are ordered
			lastEditOffset = edit.offset;
			content = content.substring(0, edit.offset) + edit.content + content.substring(edit.offset + edit.length);
		}

		assert.strictEqual(content, expected);
	}

	test('object - single property', () => {
		const content = [
			'{"x" : 1}'
		].join('\n');

		const expected = [
			'{',
			'  "x": 1',
			'}'
		].join('\n');

		format(content, expected);
	});
	test('object - multiple properties', () => {
		const content = [
			'{"x" : 1,  "y" : "foo", "z"  : true}'
		].join('\n');

		const expected = [
			'{',
			'  "x": 1,',
			'  "y": "foo",',
			'  "z": true',
			'}'
		].join('\n');

		format(content, expected);
	});
	test('object - no properties ', () => {
		const content = [
			'{"x" : {    },  "y" : {}}'
		].join('\n');

		const expected = [
			'{',
			'  "x": {},',
			'  "y": {}',
			'}'
		].join('\n');

		format(content, expected);
	});
	test('object - nesting', () => {
		const content = [
			'{"x" : {  "y" : { "z"  : { }}, "a": true}}'
		].join('\n');

		const expected = [
			'{',
			'  "x": {',
			'    "y": {',
			'      "z": {}',
			'    },',
			'    "a": true',
			'  }',
			'}'
		].join('\n');

		format(content, expected);
	});

	test('array - single items', () => {
		const content = [
			'["[]"]'
		].join('\n');

		const expected = [
			'[',
			'  "[]"',
			']'
		].join('\n');

		format(content, expected);
	});

	test('array - multiple items', () => {
		const content = [
			'[true,null,1.2]'
		].join('\n');

		const expected = [
			'[',
			'  true,',
			'  null,',
			'  1.2',
			']'
		].join('\n');

		format(content, expected);
	});

	test('array - no items', () => {
		const content = [
			'[      ]'
		].join('\n');

		const expected = [
			'[]'
		].join('\n');

		format(content, expected);
	});

	test('array - nesting', () => {
		const content = [
			'[ [], [ [ {} ], "a" ]  ]'
		].join('\n');

		const expected = [
			'[',
			'  [],',
			'  [',
			'    [',
			'      {}',
			'    ],',
			'    "a"',
			'  ]',
			']',
		].join('\n');

		format(content, expected);
	});

	test('syntax errors', () => {
		const content = [
			'[ null  1.2 "Hello" ]'
		].join('\n');

		const expected = [
			'[',
			'  null  1.2 "Hello"',
			']',
		].join('\n');

		format(content, expected);
	});

	test('syntax errors 2', () => {
		const content = [
			'{"a":"b""c":"d" }'
		].join('\n');

		const expected = [
			'{',
			'  "a": "b""c": "d"',
			'}',
		].join('\n');

		format(content, expected);
	});

	test('empty lines', () => {
		const content = [
			'{',
			'"a": true,',
			'',
			'"b": true',
			'}',
		].join('\n');

		const expected = [
			'{',
			'\t"a": true,',
			'\t"b": true',
			'}',
		].join('\n');

		format(content, expected, false);
	});
	test('single line comment', () => {
		const content = [
			'[ ',
			'//comment',
			'"foo", "bar"',
			'] '
		].join('\n');

		const expected = [
			'[',
			'  //comment',
			'  "foo",',
			'  "bar"',
			']',
		].join('\n');

		format(content, expected);
	});
	test('block line comment', () => {
		const content = [
			'[{',
			'        /*comment*/     ',
			'"foo" : true',
			'}] '
		].join('\n');

		const expected = [
			'[',
			'  {',
			'    /*comment*/',
			'    "foo": true',
			'  }',
			']',
		].join('\n');

		format(content, expected);
	});
	test('single line comment on same line', () => {
		const content = [
			' {  ',
			'        "a": {}// comment    ',
			' } '
		].join('\n');

		const expected = [
			'{',
			'  "a": {} // comment    ',
			'}',
		].join('\n');

		format(content, expected);
	});
	test('single line comment on same line 2', () => {
		const content = [
			'{ //comment',
			'}'
		].join('\n');

		const expected = [
			'{ //comment',
			'}'
		].join('\n');

		format(content, expected);
	});
	test('block comment on same line', () => {
		const content = [
			'{      "a": {}, /*comment*/    ',
			'        /*comment*/ "b": {},    ',
			'        "c": {/*comment*/}    } ',
		].join('\n');

		const expected = [
			'{',
			'  "a": {}, /*comment*/',
			'  /*comment*/ "b": {},',
			'  "c": { /*comment*/}',
			'}',
		].join('\n');

		format(content, expected);
	});

	test('block comment on same line advanced', () => {
		const content = [
			' {       "d": [',
			'             null',
			'        ] /*comment*/',
			'        ,"e": /*comment*/ [null] }',
		].join('\n');

		const expected = [
			'{',
			'  "d": [',
			'    null',
			'  ] /*comment*/,',
			'  "e": /*comment*/ [',
			'    null',
			'  ]',
			'}',
		].join('\n');

		format(content, expected);
	});

	test('multiple block comments on same line', () => {
		const content = [
			'{      "a": {} /*comment*/, /*comment*/   ',
			'        /*comment*/ "b": {}  /*comment*/  } '
		].join('\n');

		const expected = [
			'{',
			'  "a": {} /*comment*/, /*comment*/',
			'  /*comment*/ "b": {} /*comment*/',
			'}',
		].join('\n');

		format(content, expected);
	});

	test('multiple mixed comments on same line', () => {
		const content = [
			'[ /*comment*/  /*comment*/   // comment ',
			']'
		].join('\n');

		const expected = [
			'[ /*comment*/ /*comment*/ // comment ',
			']'
		].join('\n');

		format(content, expected);
	});

	test('range', () => {
		const content = [
			'{ "a": {},',
			'|"b": [null, null]|',
			'} '
		].join('\n');

		const expected = [
			'{ "a": {},',
			'"b": [',
			'  null,',
			'  null',
			']',
			'} ',
		].join('\n');

		format(content, expected);
	});

	test('range with existing indent', () => {
		const content = [
			'{ "a": {},',
			'   |"b": [null],',
			'"c": {}',
			'}|'
		].join('\n');

		const expected = [
			'{ "a": {},',
			'   "b": [',
			'    null',
			'  ],',
			'  "c": {}',
			'}',
		].join('\n');

		format(content, expected);
	});


	test('range with existing indent - tabs', () => {
		const content = [
			'{ "a": {},',
			'|  "b": [null],   ',
			'"c": {}',
			'}|    '
		].join('\n');

		const expected = [
			'{ "a": {},',
			'\t"b": [',
			'\t\tnull',
			'\t],',
			'\t"c": {}',
			'}',
		].join('\n');

		format(content, expected, false);
	});

	test('property range - issue 14623', () => {
		const content = [
			'{ |"a" :| 1,',
			'  "b": 1',
			'}'
		].join('\n');

		const expected = [
			'{ "a": 1,',
			'  "b": 1',
			'}'
		].join('\n');

		format(content, expected, false);
	});
	test('block comment none-line breaking symbols', () => {
		const content = [
			'{ "a": [ 1',
			'/* comment */',
			', 2',
			'/* comment */',
			']',
			'/* comment */',
			',',
			' "b": true',
			'/* comment */',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "a": [',
			'    1',
			'    /* comment */',
			'    ,',
			'    2',
			'    /* comment */',
			'  ]',
			'  /* comment */',
			'  ,',
			'  "b": true',
			'  /* comment */',
			'}',
		].join('\n');

		format(content, expected);
	});
	test('line comment after none-line breaking symbols', () => {
		const content = [
			'{ "a":',
			'// comment',
			'null,',
			' "b"',
			'// comment',
			': null',
			'// comment',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "a":',
			'  // comment',
			'  null,',
			'  "b"',
			'  // comment',
			'  : null',
			'  // comment',
			'}',
		].join('\n');

		format(content, expected);
	});

	test('line comment, enforce line comment ', () => {
		const content = [
			'{"settings": // This is some text',
			'{',
			'"foo": 1',
			'}',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "settings": // This is some text',
			'  {',
			'    "foo": 1',
			'  }',
			'}'
		].join('\n');

		format(content, expected);
	});

	test('random content', () => {
		const content = [
			'a 1 b 1 3 true'
		].join('\n');

		const expected = [
			'a 1 b 1 3 true',
		].join('\n');

		format(content, expected);
	});

	test('insertFinalNewline', () => {
		const content = [
			'{',
			'}'
		].join('\n');

		const expected = [
			'{}',
			''
		].join('\n');

		format(content, expected, undefined, true);
	});


	// tests added for the keepLines feature

	test('adjust the indentation of a one-line array', () => {
		const content = [
			'{ "array": [1,2,3]',
			'}'
		].join('\n');

		const expected = [
			'{ "array": [ 1, 2, 3 ]',
			'}'
		].join('\n');

		format(content, expected, true, false, true);
	});

	test('adjust the indentation of a multi-line array', () => {
		const content = [
			'{"array":',
			' [1,2,',
			' 3]',
			'}'
		].join('\n');

		const expected = [
			'{ "array":',
			'  [ 1, 2,',
			'    3 ]',
			'}'
		].join('\n');

		format(content, expected, true, false, true);
	});

	test('adjust the identation of a one-line object', () => {
		const content = [
			'{"settings": // This is some text',
			'{"foo": 1}',
			'}'
		].join('\n');

		const expected = [
			'{ "settings": // This is some text',
			'  { "foo": 1 }',
			'}'
		].join('\n');

		format(content, expected, true, false, true);
	});

	test('multiple line breaks are kept', () => {
		const content = [
			'{"settings":',
			'',
			'',
			'',
			'{"foo": 1}',
			'}'
		].join('\n');

		const expected = [
			'{ "settings":',
			'',
			'',
			'',
			'  { "foo": 1 }',
			'}'
		].join('\n');

		format(content, expected, true, false, true);
	});

	test('adjusting multiple line breaks and a block comment, line breaks are kept', () => {
		const content = [
			'{"settings":',
			'',
			'',
			'{"foo": 1} /* this is a multiline',
			'comment */',
			'}'
		].join('\n');

		const expected = [
			'{ "settings":',
			'',
			'',
			'  { "foo": 1 } /* this is a multiline',
			'comment */',
			'}'
		].join('\n');

		format(content, expected, true, false, true);
	});

	test('colon is kept on its own line', () => {
		const content = [
			'{"settings"',
			':',
			'{"foo"',
			':',
			'1}',
			'}'
		].join('\n');

		const expected = [
			'{ "settings"',
			'  :',
			'  { "foo"',
			'    :',
			'    1 }',
			'}'
		].join('\n');

		format(content, expected, true, false, true);
	});

	test('adjusting the indentation of a nested multi-line array', () => {
		const content = [
			'{',
			'',
			'{',
			'',
			'"array"   : [1, 2',
			'3, 4]',
			'}',
			'}'
		].join('\n');

		const expected = [
			'{',
			'',
			'  {',
			'',
			'    "array": [ 1, 2',
			'      3, 4 ]',
			'  }',
			'}'
		].join('\n');

		format(content, expected, true, false, true);
	});

	test('adjusting the indentation for a series of empty arrays or objects', () => {
		const content = [
			'{',
			'',
			'}',
			'',
			'{',
			'[',
			']',
			'}'
		].join('\n');

		const expected = [
			'{',
			'',
			'}',
			'',
			'{',
			'  [',
			'  ]',
			'}'
		].join('\n');

		format(content, expected, true, false, true);
	});

	test('adjusting the indentation for a series of multiple empty lines at the end', () => {
		const content = [
			'{',
			'}',
			'',
			'',
			''
		].join('\n');

		const expected = [
			'{',
			'}',
			'',
			'',
			''
		].join('\n');

		format(content, expected, true, false, true);
	});

	test('adjusting the indentation for comments on separate lines', () => {
		const content = [
			'',
			'',
			'',
			'   // comment 1',
			'',
			'',
			'',
			'  /* comment 2 */',
			'const'
		].join('\n');

		const expected = [

			'',
			'',
			'',
			'// comment 1',
			'',
			'',
			'',
			'/* comment 2 */',
			'const'
		].join('\n');

		format(content, expected, true, false, true);
	});

	test('JSON5 objects with comments', () => {
		const content = [
			'{',
			'// comment',
			'\'a\': 1,',
			'/* comment */',
			'"b" : 2',
			'c: 3',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  // comment',
			'  \'a\': 1,',
			'  /* comment */',
			'  "b": 2',
			'  c: 3',
			'}'
		].join('\n');

		format(content, expected, true, false, true);
	});

	test('JSON5 key coercion to none-double', () => {
		const content = [
			'{',
			'  "a": 1,',
			'  "b" /*comment*/: 2,',
			' "special key": 3,',
			" '\\'quote': 4",
			'}'
		].join('\n');

		const expected = [
			'{',
			'  a: 1,',
			'  b /*comment*/: 2,',
			'  "special key": 3,',
			'  "\'quote": 4',
			'}'
		].join('\n');

		format(content, expected, true, false, true, 'none-double');
	});

	test('JSON5 key coercion to none-single', () => {
		const content = [
			'{',
			'  a: 1,',
			'  \'b\' /*comment*/: 2,',
			' "special key": 3,',
			' "\\"quote": 4',
			'}'
		].join('\n');

		const expected = [
			"{",
			"  a: 1,",
			"  b /*comment*/: 2,",
			"  'special key': 3,",
			"  '\"quote': 4",
			"}"
		].join('\n');

		format(content, expected, true, false, true, 'none-single');
	});

	test('JSON5 key coercion to single', () => {
		const content = [
			'{',
			'  a: 1,',
			'  "b" /*comment*/: 2,',
			'  \'special key\': 3,',
			'  "\\"quote": 4',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  \'a\': 1,',
			'  \'b\' /*comment*/: 2,',
			'  \'special key\': 3,',
			'  \'\"quote\': 4',
			'}'
		].join('\n');

		format(content, expected, true, false, true, 'single');
	});

	test('JSON5 key coercion to double', () => {
		const content = [
			'{',
			'  a: 1,',
			'  \'b\' /*comment*/: 2,',
			'  "special key": 3,',
			'  "\'\\"quote": 4',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "a": 1,',
			'  "b" /*comment*/: 2,',
			'  "special key": 3,',
			'  "\'\\"quote": 4',
			'}'
		].join('\n');

		format(content, expected, true, false, true, 'double');
	});

	test('JSON5 string coercion to single', () => {
		const content = [
			'{',
			'  "a": \'string content\' /*comment*/,',
			'  \'b\': "awesome string",',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "a": \'string content\' /*comment*/,',
			'  \'b\': \'awesome string\',',
			'}'
		].join('\n');

		format(content, expected, true, false, true, undefined, 'single');
	});

	test('JSON5 string coercion to double', () => {
		const content = [
			'{',
			'  "a": \'string content\' /*comment*/,',
			'  \'b\': "awesome string",',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "a": "string content" /*comment*/,',
			'  \'b\': "awesome string",',
			'}'
		].join('\n');

		format(content, expected, true, false, true, undefined, 'double');
	});

	test('preserve mixed trailing comma', () => {
		const content = [
			'{',
			'  "a": 1,',
			'  "object": {',
			'    "x": 1,',
			'  },',
			'  "array": [',
			'    1,',
			'  ] // mixed',
			'}'
		].join('\n');

		const expected = content;

		format(content, expected, true, false, true, undefined, undefined, undefined);
	});

	test('remove all trailing comma', () => {
		const content = [
			'{',
			'  "array": [',
			'		 1,',
			'  ],',
			'  "object": {',
			'    "x": 1, // comment',
			'    }, // here',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "array": [',
			'    1',
			'  ],',
			'  "object": {',
			'    "x": 1 // comment',
			'  } // here',
			'}'
		].join('\n');

		format(content, expected, true, false, true, undefined, undefined, 'none');
	});

	test('add trailing comma', () => {
		const content = [
			'{',
			'  "array": [',
			'    1',
			'  ],',
			'  "object": {',
			'    "x": 1 // comment',
			'    }, // here',
			'  "empty_array": [],',
			'  "empty_object_with_return": {',
			'  }',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "array": [',
			'    1,',
			'  ],',
			'  "object": {',
			'    "x": 1, // comment',
			'  }, // here',
			'  "empty_array": [],',
			'  "empty_object_with_return": {},',
			'}'
		].join('\n');

		format(content, expected, true, false, false, undefined, undefined, 'all');
	});

	test('ignore directive - default directives', () => {
		const content = [
			'{',
			'  "a": 1,',
			'  // json5-fmt: off',
			'  "b"   :   2   ,',
			'  "c"  :    3,',
			'  // json5-fmt: on',
			'  "d": 4',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "a": 1,',
			'  // json5-fmt: off',
			'  "b"   :   2   ,',
			'  "c"  :    3,',
			'  // json5-fmt: on',
			'  "d": 4',
			'}'
		].join('\n');

		format(content, expected);
	});

	test('ignore directive - custom directives', () => {
		const content = [
			'{',
			'  "a": 1,',
			'  // disable-format',
			'  "b"   :   2   ,',
			'  "c"  :    3,',
			'  // enable-format',
			'  "d":   4',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "a": 1,',
			'  // disable-format',
			'  "b"   :   2   ,',
			'  "c"  :    3,',
			'  // enable-format',
			'  "d": 4',
			'}'
		].join('\n');

		format(content, expected, true, false, false, undefined, undefined, undefined, 'disable-format', 'enable-format');
	});

	test('ignore directive - nested objects', () => {
		const content = [
			'{',
			'  "outer": {',
			'    "a": 1,',
			'    // json5-fmt: off',
			'    "nested"   :   {',
			'      "b"  :  2  ,',
			'      "c":3',
			'    }   ,',
			'    // json5-fmt: on',
			'    "d": 4',
			'  }',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "outer": {',
			'    "a": 1,',
			'    // json5-fmt: off',
			'    "nested"   :   {',
			'      "b"  :  2  ,',
			'      "c":3',
			'    }   ,',
			'    // json5-fmt: on',
			'    "d": 4',
			'  }',
			'}'
		].join('\n');

		format(content, expected);
	});

	test('ignore directive - arrays', () => {
		const content = [
			'{',
			'  "array": [',
			'    1,',
			'    // json5-fmt: off',
			'    2   ,   3,',
			'    [4,5   ,6],',
			'    // json5-fmt: on',
			'    7',
			'  ]',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "array": [',
			'    1,',
			'    // json5-fmt: off',
			'    2   ,   3,',
			'    [4,5   ,6],',
			'    // json5-fmt: on',
			'    7',
			'  ]',
			'}'
		].join('\n');

		format(content, expected);
	});

	test('ignore directive - multiple ignore blocks', () => {
		const content = [
			'{',
			'  "a":  1,',
			'  // json5-fmt: off',
			'  "b"   :   2,',
			'  // json5-fmt: on',
			'  "c":  3,',
			'  // json5-fmt: off',
			'  "d"   :   4,',
			'  // json5-fmt: on',
			'  "e":  5',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "a": 1,',
			'  // json5-fmt: off',
			'  "b"   :   2,',
			'  // json5-fmt: on',
			'  "c": 3,',
			'  // json5-fmt: off',
			'  "d"   :   4,',
			'  // json5-fmt: on',
			'  "e": 5',
			'}'
		].join('\n');

		format(content, expected);
	});

	test('ignore directive - ignore with trailing commas', () => {
		const content = [
			'{',
			'  "a": 1,',
			'  // json5-fmt: off',
			'  "b": 2   ,',
			'  "c": 3',
			'  // json5-fmt: on',
			'  "d": 4',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "a": 1,',
			'  // json5-fmt: off',
			'  "b": 2   ,',
			'  "c": 3',
			'  // json5-fmt: on',
			'  "d": 4,',
			'}'
		].join('\n');

		format(content, expected, true, false, false, undefined, undefined, 'all');
	});

	test('ignore directive - ignore with key quotes', () => {
		const content = [
			'{',
			'  a: 1,',
			'  // json5-fmt: off',
			'  b   :   2,',
			'  c: 3,',
			'  // json5-fmt: on',
			'  d: 4',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "a": 1,',
			'  // json5-fmt: off',
			'  b   :   2,',
			'  c: 3,',
			'  // json5-fmt: on',
			'  "d": 4',
			'}'
		].join('\n');

		format(content, expected, true, false, false, 'double');
	});

	test('ignore directive - ignore start only (remains ignored till end)', () => {
		const content = [
			'{',
			'  "a": 1,',
			'  // json5-fmt: off',
			'  "b"   :   2,',
			'  "c"  :    3,',
			'  "d":4',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "a": 1,',
			'  // json5-fmt: off',
			'  "b"   :   2,',
			'  "c"  :    3,',
			'  "d":4',
			'}'
		].join('\n');

		format(content, expected);
	});

	test('ignore directive - directive with extra whitespace', () => {
		const content = [
			'{',
			'  "a": 1,',
			'  //   json5-fmt: off   ',
			'  "b"   :   2,',
			'  //  json5-fmt: on  ',
			'  "c":  3',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "a": 1,',
			'  //   json5-fmt: off   ',
			'  "b"   :   2,',
			'  //  json5-fmt: on  ',
			'  "c": 3',
			'}'
		].join('\n');

		format(content, expected);
	});

	test('ignore directive - partial line comment directive', () => {
		const content = [
			'{',
			'  "a": 1,',
			'  // This is a comment with json5-fmt: off inside',
			'  "b"   :   2,',
			'  // Another comment with json5-fmt: on here',
			'  "c":  3',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "a": 1,',
			'  // This is a comment with json5-fmt: off inside',
			'  "b": 2,',
			'  // Another comment with json5-fmt: on here',
			'  "c": 3',
			'}'
		].join('\n');

		format(content, expected);
	});

	test('ignore directive - range formatting with ignore', () => {
		const content = [
			'{',
			'  "a": 1,',
			'  // json5-fmt: off',
			'  |"b"   :   2,',
			'  "c"  :    3,|',
			'  // json5-fmt: on',
			'  "d":   4',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "a": 1,',
			'  // json5-fmt: off',
			'  "b": 2,',
			'  "c": 3,',
			'  // json5-fmt: on',
			'  "d":   4',
			'}'
		].join('\n');

		format(content, expected);
	});

	test('ignore directive - block comments are not supported', () => {
		const content = [
			'{',
			'  "a":  1,',
			'  /* json5-fmt: off */',
			'  "b"   :   2,',
			'  /* json5-fmt: on */',
			'  "c":  3',
			'}'
		].join('\n');

		const expected = [
			'{',
			'  "a": 1,',
			'  /* json5-fmt: off */',
			'  "b": 2,',
			'  /* json5-fmt: on */',
			'  "c": 3',
			'}'
		].join('\n');

		format(content, expected);
	});

	test('multi-line string - preserve string literal and format rest', () => {
		const content = [
			'[',
			'  // json5-fmt: off',
			'"\\',
			'Line1\\',
			'Line2",',
			'  // json5-fmt: on',
			'  {"a":1}',
			']',
		].join('\n');

		const expected = [
			'[',
			'  // json5-fmt: off',
			'"\\',
			'Line1\\',
			'Line2",',
			'  // json5-fmt: on',
			'  {',
			'    "a": 1',
			'  }',
			']',
		].join('\n');

		format(content, expected);
	});

	test('list ignore directive - custom directives inside array', () => {
		const content = [
			'[',
			'  1,',
			'2, // off',
			'    3   , 4  ,',
			'  // on',
			'    5',
			']',
		].join('\n');

		const expected = [
			'[',
			'  1,',
			'  2, // off',
			'    3   , 4  ,',
			'  // on',
			'  5',
			']',
		].join('\n');

		format(content, expected, true, false, false, undefined, undefined, undefined, 'off', 'on');
	});

	test('ignore directive with trailing comma', () => {
		const content = [
			'{',
			'  // json5-fmt: off',
			'  "a": 1',
			'  // json5-fmt: on',
			'}',
		].join('\n');

		const expected = [
			'{',
			'  // json5-fmt: off',
			'  "a": 1',
			'  // json5-fmt: on',
			'}',
		].join('\n');

		format(content, expected, true, false, false, undefined, undefined, 'all');
	});


	test('ignore directive with trailing comma - rev', () => {
		const content = [
			'{',
			'  // json5-fmt: off',
			'  "a": 1,',
			'  // json5-fmt: on',
			'}',
		].join('\n');

		const expected = [
			'{',
			'  // json5-fmt: off',
			'  "a": 1,',
			'  // json5-fmt: on',
			'}',
		].join('\n');

		format(content, expected, true, false, false, undefined, undefined, 'none');
	});

	test('trailing comma with line comments - 1', () => {
		const content = [
			'{',
			'  // a',
			'  "a": 1,',
			'  // b',
			'}',
		].join('\n');

		const expected = [
			'{',
			'  // a',
			'  "a": 1',
			'  // b',
			'}',
		].join('\n');

		format(content, expected, true, false, false, undefined, undefined, 'none');
	});

	test('trailing comma with line comments - 2', () => {
		const content = [
			'{',
			'  // a',
			'  "a": 1',
			'  // b',
			'}',
		].join('\n');

		const expected = [
			'{',
			'  // a',
			'  "a": 1,',
			'  // b',
			'}',
		].join('\n');

		format(content, expected, true, false, false, undefined, undefined, 'all');
	});
});

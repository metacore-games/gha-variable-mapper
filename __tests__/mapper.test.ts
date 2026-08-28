import {JSONMapper} from '../src/mapper'

describe('JSONMapper', () => {
  const mapper = new JSONMapper(
    '{"k.y":{"env1":"value1"},".*":{"env2":"value2"}}',
    'first_match'
  )

  it('JSONMapper holds the order of keys', () => {
    const expects = ['k.y', '.*']
    for (const [index, pair] of mapper.pairs.entries()) {
      expect(pair.key).toBe(expects[index])
    }
  })

  it('JSONMapper can be matched with regular expressions', () => {
    const got = mapper.match('key')
    if (!got) {
      throw new Error('No match')
    }
    expect(got.key).toBe('k.y')
    expect(got.variables).toMatchObject(new Map([['env1', 'value1']]))
  })

  it('JSONMapper should throw an exception on invalid input', () => {
    expect(() => {
      new JSONMapper('{"invalid":"schema"}', 'first_match')
    }).toThrow()
  })

  describe('Complex Regular Expression Key', () => {
    const mapper = new JSONMapper(
      '{"^key(-[\\\\w-]*)?$":{"env1":"value1"},".*":{"env1":"value2"}}',
      'first_match'
    )

    it('holds the order of keys', () => {
      const expects = ['^key(-[\\w-]*)?$', '.*']
      for (const [index, pair] of mapper.pairs.entries()) {
        expect(pair.key).toBe(expects[index])
      }
    })

    it('can be matched with regular expressions', () => {
      const got = mapper.match('key-match-string')
      if (!got) {
        throw new Error('No match')
      }
      expect(got.key).toBe('^key(-[\\w-]*)?$')
      expect(got.variables).toMatchObject(new Map([['env1', 'value1']]))
    })

    it('can not be matched with regular expressions', () => {
      const got = mapper.match('key-not+match+string')
      if (!got) {
        throw new Error('No match')
      }
      expect(got.key).toBe('.*')
      expect(got.variables).toMatchObject(new Map([['env1', 'value2']]))
    })
  })

  describe('Overwrite Matcher', () => {
    const overwrite = new JSONMapper(
      '{"k.y":{"env1":"value1","env2":"value2"},".*":{"env2":"overwrite"}}',
      'overwrite'
    )

    it('Overwrite Matcher can match and overwrite multiple values', () => {
      const got = overwrite.match('key')
      if (!got) {
        throw new Error('No match')
      }
      expect(got.key).toBe('k.y\n.*')
      expect(got.variables).toMatchObject(
        new Map([
          ['env1', 'value1'],
          ['env2', 'overwrite']
        ])
      )
    })
  })

  describe('Fill Matcher', () => {
    const overwrite = new JSONMapper(
      '{"k.y":{"env1":"value1"},".*":{"env1":"not_overwrite", "env2":"fill"}}',
      'fill'
    )

    it('Overwrite Matcher can match and overwrite multiple values', () => {
      const got = overwrite.match('key')
      if (!got) {
        throw new Error('No match')
      }
      expect(got.key).toBe('.*\nk.y')
      expect(got.variables).toMatchObject(
        new Map([
          ['env1', 'value1'],
          ['env2', 'fill']
        ])
      )
    })
  })

  describe('Partial matches', () => {
    const mapper = new JSONMapper(
      '{"dev1":{"env1":"dev1"},"mansion-dev1":{"env1":"mansion-dev1"}}',
      'first_match'
    )

    it('does not match a key that only contains the pattern as a substring', () => {
      const got = mapper.match('mansion-dev1')
      if (!got) {
        throw new Error('No match')
      }
      expect(got.key).toBe('mansion-dev1')
      expect(got.variables).toMatchObject(new Map([['env1', 'mansion-dev1']]))
    })

    it('still matches the exact key', () => {
      const got = mapper.match('dev1')
      if (!got) {
        throw new Error('No match')
      }
      expect(got.key).toBe('dev1')
      expect(got.variables).toMatchObject(new Map([['env1', 'dev1']]))
    })

    it('returns undefined when no pattern covers the whole key', () => {
      expect(mapper.match('dev12')).toBeUndefined()
    })
  })
})

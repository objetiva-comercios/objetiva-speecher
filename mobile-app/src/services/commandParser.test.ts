import { describe, it, expect } from 'vitest';
import { parseCommands } from './commandParser';

describe('parseCommands', () => {
  describe('empty and passthrough', () => {
    it('returns empty string for empty input', () => {
      expect(parseCommands('')).toBe('');
    });

    it('returns normal text unchanged', () => {
      expect(parseCommands('normal text')).toBe('normal text');
    });

    it('preserves text with no commands', () => {
      expect(parseCommands('hello world')).toBe('hello world');
    });
  });

  describe('basic punctuation', () => {
    it('converts punto to period', () => {
      expect(parseCommands('punto')).toBe('.');
    });

    it('converts coma to comma', () => {
      expect(parseCommands('coma')).toBe(',');
    });

    it('converts dos puntos to colon', () => {
      expect(parseCommands('dos puntos')).toBe(':');
    });

    it('converts punto y coma to semicolon', () => {
      expect(parseCommands('punto y coma')).toBe(';');
    });

    it('converts guion to hyphen', () => {
      expect(parseCommands('guion')).toBe('-');
    });

    it('converts interrogacion to question mark', () => {
      expect(parseCommands('interrogacion')).toBe('?');
    });

    it('converts signo de interrogacion to question mark', () => {
      expect(parseCommands('signo de interrogacion')).toBe('?');
    });

    it('converts exclamacion to exclamation mark', () => {
      expect(parseCommands('exclamacion')).toBe('!');
    });

    it('converts signo de exclamacion to exclamation mark', () => {
      expect(parseCommands('signo de exclamacion')).toBe('!');
    });
  });

  describe('symbols', () => {
    it('converts arroba to at sign', () => {
      expect(parseCommands('arroba')).toBe('@');
    });

    it('converts hashtag to hash', () => {
      expect(parseCommands('hashtag')).toBe('#');
    });

    it('converts numeral to hash', () => {
      expect(parseCommands('numeral')).toBe('#');
    });

    it('converts dolar to dollar sign', () => {
      expect(parseCommands('dolar')).toBe('$');
    });

    it('converts porcentaje to percent sign', () => {
      expect(parseCommands('porcentaje')).toBe('%');
    });

    it('converts espacio to space', () => {
      expect(parseCommands('espacio')).toBe(' ');
    });
  });

  describe('paired symbols - parentheses', () => {
    it('converts abre parentesis to open paren', () => {
      expect(parseCommands('abre parentesis')).toBe('(');
    });

    it('converts cierra parentesis to close paren', () => {
      expect(parseCommands('cierra parentesis')).toBe(')');
    });

    it('wraps content in parentheses', () => {
      expect(parseCommands('abre parentesis hola cierra parentesis')).toBe('(hola)');
    });
  });

  describe('paired symbols - brackets', () => {
    it('converts abre corchete to open bracket', () => {
      expect(parseCommands('abre corchete')).toBe('[');
    });

    it('converts cierra corchete to close bracket', () => {
      expect(parseCommands('cierra corchete')).toBe(']');
    });
  });

  describe('paired symbols - braces', () => {
    it('converts abre llave to open brace', () => {
      expect(parseCommands('abre llave')).toBe('{');
    });

    it('converts cierra llave to close brace', () => {
      expect(parseCommands('cierra llave')).toBe('}');
    });
  });

  describe('paired symbols - double quotes', () => {
    it('converts abre comillas to open quote', () => {
      expect(parseCommands('abre comillas')).toBe('"');
    });

    it('converts cierra comillas to close quote', () => {
      expect(parseCommands('cierra comillas')).toBe('"');
    });
  });

  describe('paired symbols - single quotes', () => {
    it('converts abre comilla simple to open single quote', () => {
      expect(parseCommands('abre comilla simple')).toBe("'");
    });

    it('converts cierra comilla simple to close single quote', () => {
      expect(parseCommands('cierra comilla simple')).toBe("'");
    });
  });

  describe('compound commands', () => {
    it('converts punto com to .com', () => {
      expect(parseCommands('punto com')).toBe('.com');
    });

    it('builds email address', () => {
      expect(parseCommands('arroba ejemplo punto com')).toBe('@ejemplo.com');
    });
  });

  describe('case insensitivity', () => {
    it('converts Punto (capitalized) to period', () => {
      expect(parseCommands('Punto')).toBe('.');
    });

    it('converts PUNTO (uppercase) to period', () => {
      expect(parseCommands('PUNTO')).toBe('.');
    });

    it('converts Coma (capitalized) to comma', () => {
      expect(parseCommands('Coma')).toBe(',');
    });

    it('converts DOS PUNTOS (uppercase) to colon', () => {
      expect(parseCommands('DOS PUNTOS')).toBe(':');
    });

    it('converts Abre Parentesis (mixed case) to open paren', () => {
      expect(parseCommands('Abre Parentesis')).toBe('(');
    });
  });

  describe('word boundary protection', () => {
    it('does not convert punto in contrapunto', () => {
      expect(parseCommands('contrapunto')).toBe('contrapunto');
    });

    it('does not convert coma in comadreja', () => {
      expect(parseCommands('comadreja')).toBe('comadreja');
    });

    it('does not convert punto at start of compound word', () => {
      expect(parseCommands('puntoaparte')).toBe('puntoaparte');
    });

    it('preserves word boundaries in context', () => {
      expect(parseCommands('el contrapunto musical')).toBe('el contrapunto musical');
    });
  });

  describe('multi-word command adjacency', () => {
    it('converts dos puntos when adjacent', () => {
      expect(parseCommands('hola dos puntos adios')).toBe('hola: adios');
    });

    it('does not convert when words are not adjacent', () => {
      // "dos y puntos" should not become ":"
      expect(parseCommands('dos y puntos')).toBe('dos y puntos');
    });

    it('converts punto y coma when all three words are adjacent', () => {
      expect(parseCommands('hola punto y coma adios')).toBe('hola; adios');
    });
  });

  describe('escape mechanism (literal)', () => {
    it('escapes punto to literal word', () => {
      expect(parseCommands('literal punto')).toBe('punto');
    });

    it('escapes coma to literal word', () => {
      expect(parseCommands('literal coma')).toBe('coma');
    });

    it('escapes followed by command then regular command', () => {
      expect(parseCommands('literal coma mas coma')).toBe('coma mas,');
    });

    it('escapes multiple words independently', () => {
      expect(parseCommands('literal punto y literal coma')).toBe('punto y coma');
    });

    it('is case insensitive for literal keyword', () => {
      expect(parseCommands('Literal punto')).toBe('punto');
    });

    it('preserves non-command word after literal', () => {
      expect(parseCommands('literal hola')).toBe('hola');
    });
  });

  describe('space normalization', () => {
    it('removes space before period', () => {
      expect(parseCommands('hola punto adios')).toBe('hola. adios');
    });

    it('removes space before comma', () => {
      expect(parseCommands('hola coma adios')).toBe('hola, adios');
    });

    it('removes space before question mark', () => {
      expect(parseCommands('como estas interrogacion')).toBe('como estas?');
    });

    it('removes space after opening paren', () => {
      expect(parseCommands('abre parentesis hola')).toBe('(hola');
    });

    it('removes space before closing paren', () => {
      expect(parseCommands('hola cierra parentesis')).toBe('hola)');
    });

    it('handles multiple punctuation in sequence', () => {
      expect(parseCommands('que coma por que interrogacion')).toBe('que, por que?');
    });
  });

  describe('explicit space preservation', () => {
    it('preserves single explicit space', () => {
      expect(parseCommands('espacio')).toBe(' ');
    });

    it('preserves two explicit spaces', () => {
      expect(parseCommands('espacio espacio')).toBe('  ');
    });

    it('inserts explicit spaces between words', () => {
      expect(parseCommands('hola espacio espacio adios')).toBe('hola  adios');
    });
  });

  describe('complex sentences', () => {
    it('handles mixed commands and text', () => {
      expect(parseCommands('hola coma como estas interrogacion')).toBe('hola, como estas?');
    });

    it('handles email pattern', () => {
      expect(parseCommands('mi correo es usuario arroba ejemplo punto com')).toBe('mi correo es usuario@ejemplo.com');
    });

    it('handles quote pattern', () => {
      expect(parseCommands('el dijo abre comillas hola cierra comillas')).toBe('el dijo "hola"');
    });

    it('handles code pattern', () => {
      expect(parseCommands('funcion abre parentesis x coma y cierra parentesis')).toBe('funcion(x, y)');
    });

    it('handles multiple punctuation types', () => {
      expect(parseCommands('primero punto segundo coma tercero dos puntos final')).toBe('primero. segundo, tercero: final');
    });
  });
});

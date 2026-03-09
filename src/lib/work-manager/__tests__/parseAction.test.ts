// ===================================================
// parseAction & parseConfidence — Unit Tests
// ===================================================

import { describe, it, expect } from 'vitest';
import { parseAction, parseConfidence } from '../parseAction';
import type { WorkAction } from '../parseAction';

describe('parseAction', () => {
  it('returns original text and null action when no ACTION block is present', () => {
    const content = 'This is a plain message with no action.';
    const result = parseAction(content);

    expect(result.text).toBe(content);
    expect(result.action).toBeNull();
  });

  it('returns null when details is a string (not an object)', () => {
    const json = '{"type":"create_task","title":"Fix login bug","details":"see ticket"}';
    const content = `Here is your task. ACTION: ${json}`;
    const result = parseAction(content);

    expect(result.text).toBe(content);
    expect(result.action).toBeNull();
  });

  it('returns original text and null action when JSON is malformed', () => {
    const content = 'Something ACTION: {not valid json!!!}';
    const result = parseAction(content);

    expect(result.text).toBe(content);
    expect(result.action).toBeNull();
  });

  // ----- Nested details object (the core case) -----
  describe('parses nested details objects correctly', () => {
    const actionTypes: WorkAction['type'][] = [
      'create_task',
      'update_status',
      'add_note',
      'invoke_persona',
    ];

    for (const type of actionTypes) {
      it(`parses "${type}" with nested details object`, () => {
        const action = { type, title: `Test ${type}`, details: { key: 'value' } };
        const content = `Message. ACTION: ${JSON.stringify(action)}`;
        const result = parseAction(content);

        expect(result.action).not.toBeNull();
        expect(result.action!.type).toBe(type);
        expect(result.action!.title).toBe(`Test ${type}`);
        expect(result.action!.details).toEqual({ key: 'value' });
        expect(result.text).toBe('Message.');
      });
    }

    it('parses empty details object {}', () => {
      const json = '{"type":"create_task","title":"T","details":{}}';
      const content = `Text ACTION: ${json}`;
      const result = parseAction(content);

      expect(result.action).not.toBeNull();
      expect(result.action!.type).toBe('create_task');
      expect(result.action!.details).toEqual({});
      expect(result.text).toBe('Text');
    });
  });

  it('parses ACTION at end of message with nested details', () => {
    const content =
      'I completed the analysis for you.\n\nACTION: {"type":"add_note","title":"Analysis complete","details":{"doc":"report-v2"}}';
    const result = parseAction(content);

    expect(result.action).not.toBeNull();
    expect(result.action!.type).toBe('add_note');
    expect(result.action!.details).toEqual({ doc: 'report-v2' });
    expect(result.text).toBe('I completed the analysis for you.');
  });

  it('parses ACTION in middle of message with nested details', () => {
    const content =
      'Before the action. ACTION: {"type":"update_status","title":"Mark done","details":{"status":"done"}} After the action.';
    const result = parseAction(content);

    expect(result.action).not.toBeNull();
    expect(result.action!.type).toBe('update_status');
    expect(result.action!.details).toEqual({ status: 'done' });
    expect(result.text).toContain('Before the action.');
    expect(result.text).toContain('After the action.');
  });

  // ----- Missing required fields -----
  it('returns null action when required fields are missing', () => {
    const content = 'Oops ACTION: {"type":"create_task"}';
    const result = parseAction(content);

    expect(result.text).toBe(content);
    expect(result.action).toBeNull();
  });

  it('returns null action when details is null', () => {
    const content = 'Test ACTION: {"type":"create_task","title":"T","details":null}';
    const result = parseAction(content);

    expect(result.text).toBe(content);
    expect(result.action).toBeNull();
  });

  it('returns null action when title is missing', () => {
    const content = 'Test ACTION: {"type":"create_task","details":{"k":"v"}}';
    const result = parseAction(content);

    expect(result.action).toBeNull();
  });

  it('returns null action when type is missing', () => {
    const content = 'Test ACTION: {"title":"T","details":{"k":"v"}}';
    const result = parseAction(content);

    expect(result.action).toBeNull();
  });
});

describe('parseConfidence', () => {
  it('returns original text and null confidence when no emoji is present', () => {
    const content = 'Just a regular message.';
    const result = parseConfidence(content);

    expect(result.text).toBe(content);
    expect(result.confidence).toBeNull();
  });

  it('detects trailing green circle emoji as high confidence', () => {
    const content = 'I am confident about this.\n🟢';
    const result = parseConfidence(content);

    expect(result.confidence).toBe('high');
    expect(result.text).toBe('I am confident about this.');
  });

  it('detects trailing yellow circle emoji as medium confidence', () => {
    const content = 'Somewhat sure.\n🟡';
    const result = parseConfidence(content);

    expect(result.confidence).toBe('medium');
    expect(result.text).toBe('Somewhat sure.');
  });

  it('detects trailing red circle emoji as low confidence', () => {
    const content = 'Not very sure.\n🔴';
    const result = parseConfidence(content);

    expect(result.confidence).toBe('low');
    expect(result.text).toBe('Not very sure.');
  });

  it('detects green emoji with parenthetical Hebrew text', () => {
    const content = 'I checked the data.\n🟢 (בטוח)';
    const result = parseConfidence(content);

    expect(result.confidence).toBe('high');
    expect(result.text).toBe('I checked the data.');
  });

  it('detects yellow emoji with parenthetical text', () => {
    const content = 'Needs review.\n🟡 (not sure)';
    const result = parseConfidence(content);

    expect(result.confidence).toBe('medium');
    expect(result.text).toBe('Needs review.');
  });

  it('does NOT match emoji in the middle of the message', () => {
    const content = 'Status is 🟢 and we continue working on it.';
    const result = parseConfidence(content);

    expect(result.text).toBe(content);
    expect(result.confidence).toBeNull();
  });

  it('returns null for empty string', () => {
    const result = parseConfidence('');
    expect(result.text).toBe('');
    expect(result.confidence).toBeNull();
  });

  it('returns null when message contains only regular text', () => {
    const content = 'Everything looks good, no emoji here.';
    const result = parseConfidence(content);

    expect(result.text).toBe(content);
    expect(result.confidence).toBeNull();
  });
});

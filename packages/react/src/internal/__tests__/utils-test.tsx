import PropTypes from 'prop-types';
import React from 'react';
import { elementTypeValidator, getTypedObjectKeys } from '../utils';

describe('getTypedObjectKeys', () => {
  it('should return typed keys of a simple object', () => {
    const obj = { a: 1, b: 'two', c: true };
    const keys = getTypedObjectKeys(obj);

    expect(keys).toEqual(['a', 'b', 'c']);
    // Check types
    type Keys = (typeof keys)[number];
    const testKey: Keys = 'a'; // should not error
    expect(testKey).toBe('a');
  });

  it('should return an empty array for an empty object', () => {
    const obj = {};
    const keys = getTypedObjectKeys(obj);
    expect(keys).toEqual([]);
  });

  it('should maintain key types in a nested object', () => {
    const obj = { a: { nested: true }, b: 2 };
    const keys = getTypedObjectKeys(obj);
    expect(keys).toEqual(['a', 'b']);
  });
});

/*
describe('elementTypeValidator', () => {
  const propName = 'customComponent';
  const componentName = 'TestComponent';
  const location = 'prop';
  const propFullName = propName;

  it('should not return error for valid React component', () => {
    const props = { [propName]: () => <div /> };
    const result = elementTypeValidator(
      props,
      propName,
      componentName,
      location,
      propFullName
    );
    expect(result).toBeNull();
  });

  it('should return error for invalid component type (like a string)', () => {
    const props = { [propName]: 'notAComponent' };
    const result = elementTypeValidator(
      props,
      propName,
      componentName,
      location,
      propFullName
    );
    expect(result).toBeInstanceOf(Error);
    expect(result?.message).toContain('Invalid');
  });

  it('should allow null or undefined if optional', () => {
    expect(
      elementTypeValidator({}, propName, componentName, location, propFullName)
    ).toBeNull();

    expect(
      elementTypeValidator(
        { [propName]: null },
        propName,
        componentName,
        location,
        propFullName
      )
    ).toBeNull();

    expect(
      elementTypeValidator(
        { [propName]: undefined },
        propName,
        componentName,
        location,
        propFullName
      )
    ).toBeNull();
  });
});
*/

/*
const customPropTypes = {
  customComponent: elementTypeValidator,
};

const consoleErrorMock = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {});

describe('elementTypeValidator', () => {
  afterEach(() => {
    consoleErrorMock.mockClear();
  });

  afterAll(() => {
    consoleErrorMock.mockRestore();
  });

  it('should not return error for valid React component', () => {
    const props = { customComponent: () => <div /> };

    PropTypes.checkPropTypes(customPropTypes, props, 'prop', 'TestComponent');

    expect(consoleErrorMock).not.toHaveBeenCalled();
  });

  it('should return error for invalid component type (like a string)', () => {
    const props = { customComponent: 'notAComponent' };

    PropTypes.checkPropTypes(customPropTypes, props, 'prop', 'TestComponent');

    expect(consoleErrorMock).toHaveBeenCalled();
  });

  it('should allow null or undefined if optional', () => {
    PropTypes.checkPropTypes(
      customPropTypes,
      { customComponent: null },
      'prop',
      'TestComponent'
    );

    PropTypes.checkPropTypes(
      customPropTypes,
      { customComponent: undefined },
      'prop',
      'TestComponent'
    );

    expect(consoleErrorMock).not.toHaveBeenCalled();
  });
});
*/

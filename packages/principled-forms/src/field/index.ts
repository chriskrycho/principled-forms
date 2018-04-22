import Maybe, { Just, Nothing } from 'true-myth/maybe';

import Validity, { Validator, Validated } from '../validity';

export enum Type {
  email = 'email',
  text = 'text',
  number = 'number',
  color = 'color',
  date = 'date',
  password = 'password',
  checkbox = 'checkbox',
  radio = 'radio',
}

const isMaybe = (v: any): v is Maybe<any> => v instanceof Just || v instanceof Nothing;

const _validate = <T extends InputTypes>(field: Field<T>): Validated[] => {
  const rule = field.isRequired ? Validity.required : Validity.optional;
  return rule(...field.validators)(field.value);
};

export enum Laziness {
  Lazy,
  Eager,
}

export function validate<T extends InputTypes>(field: Field<T>): Field<T> {
  const validities = _validate(field);

  // We eagerly validate *either* when configured to *or* when the field has
  // already been validated, since in that case any change to invalidity should
  // immediately be flagged to the user.
  const eagerlyValidate = field.eager || Validity.isValidated(field.validity);

  const onInvalid = (reason: string) =>
    eagerlyValidate ? Validity.Invalid.because(reason) : Validity.unvalidated();

  const newValidity = validities.every(Validity.isValid)
    ? Validity.valid()
    : onInvalid(validities.find(Validity.isInvalid)!.reason); // at least one by definition

  return { ...field, validity: newValidity };
}

// <Input @type={{@model.type}} @value={{@model.value}} />

export type InputTypes = string | number | boolean;

export interface MinimalField<T extends InputTypes> {
  value?: T;
  isRequired: boolean;
  readonly type: Type;
  readonly validators: Validator<T>[];
  readonly validity: Validity;
}

export type RequiredFieldConfig<T extends InputTypes> = Partial<{
  type: Type;
  eager: boolean;
  validity: Validity;
  validators: Array<Validator<T>>;
  value: T;
}>;

export class RequiredField<T extends InputTypes> implements MinimalField<T> {
  value?: T;
  eager: boolean;

  isRequired: true = true;

  readonly type: Type;
  readonly validators: Array<Validator<T>>;
  readonly validity: Validity;

  constructor({
    type = Type.text,
    validity = Validity.unvalidated(),
    validators = [],
    value = undefined,
    eager = true,
  }: RequiredFieldConfig<T> = {}) {
    this.type = type;
    this.value = value;
    this.eager = eager;
    this.validity = validity;
    this.validators = validators;
  }
}

const required = <T extends InputTypes>(config?: RequiredFieldConfig<T>) =>
  new RequiredField(config);

export type OptionalFieldConfig<T extends InputTypes> = Partial<{
  type: Type;
  eager: boolean;
  validity: Validity;
  validators: Array<Validator<T>>;
  value: T | Maybe<T>;
}>;

export class OptionalField<T extends InputTypes> implements MinimalField<T> {
  value?: T;
  eager: boolean;

  isRequired: false = false;

  readonly type: Type;
  readonly validators: Array<Validator<T>>;
  readonly validity: Validity;

  constructor({
    type = Type.text,
    validity = Validity.unvalidated(),
    validators = [],
    value = undefined,
    eager = true,
  }: OptionalFieldConfig<T> = {}) {
    if (isMaybe(value)) {
      this.value = value.isJust() ? value.unsafelyUnwrap() : undefined;
    } else {
      this.value = value;
    }

    this.type = type;
    this.eager = eager;
    this.validity = validity;
    this.validators = validators;
  }
}

const optional = <T extends InputTypes>(config?: OptionalFieldConfig<T>) =>
  new OptionalField(config);

export type Field<T extends InputTypes> = RequiredField<T> | OptionalField<T>;

export interface FieldConstructors<T extends InputTypes> {
  required(options: RequiredFieldConfig<T>): RequiredField<T>;
  optional(options: OptionalFieldConfig<T>): OptionalField<T>;
}

export const Field = {
  Required: RequiredField,
  Optional: OptionalField,
  required,
  optional,
  validate,
};

export default Field;

import { Maybe } from 'true-myth';
import Form from '../src/form';
import Field, { Type } from '../src/field';
import NumberField from '../src/field/number';
import { minLength, maxLength, minValue } from '../src/validators';

type User = {
  age: number;
  name?: string;
  familyName: Maybe<string>;
};

const nameValidations = [minLength(1), maxLength(40)];

const fromUser = (user: User): Form<User> => ({
  age: NumberField.required({ type: Type.number, validators: [minValue(0)], value: user.age }),
  name: Field.optional({ validators: nameValidations, value: user.name }),
  familyName: Field.optional({ validators: nameValidations, value: user.familyName }),
});

const fromMaybeUser = Maybe.match({
  Just: fromUser,
  Nothing: () => ({
    age: NumberField.required({ type: Type.number, validators: [minValue(0)] }),
    name: Field.optional({ validators: nameValidations }),
    familyName: Field.optional({ validators: nameValidations }),
  }),
});

const chris: User = {
  name: 'Chris',
  age: 30,
  familyName: Maybe.just('Krycho'),
};

const nobody: Maybe<User> = Maybe.nothing();

const chrisForm = fromUser(chris);
const nobodyForm = fromMaybeUser(nobody);
const validChris = Form.isValid(chrisForm);
const validNobody = Form.isValid(nobodyForm);

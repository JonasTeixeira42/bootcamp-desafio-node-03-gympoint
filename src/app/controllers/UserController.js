import * as Yup from 'yup';
import User from '../models/User';

class UserController {
  async store(req, res) {
    let errorMessage = '';
    const schema = Yup.object().shape({
      name: Yup.string().required('Name is required'),
      email: Yup.string()
        .email('Email must be a valid email format')
        .required('Email is required'),
      password: Yup.string()
        .min(6, 'Minimum value 6')
        .required('Password is required'),
    });

    schema.validate(req.body, { abortEarly: false }).catch(error => {
      [errorMessage] = error.errors;
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: errorMessage });
    }

    const userExists = await User.findOne({
      where: { email: req.body.email },
    });

    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const { id, name, email } = await User.create(req.body);

    return res.status(200).json({ id, name, email });
  }

  async update(req, res) {
    let errorMessage = '';
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email('Email must be a valid email format'),
      oldPassword: Yup.string().min(6, 'Minimum value 6'),
      password: Yup.string()
        .min(6, 'Minimum value 6')
        .when('oldPassword', (oldPassword, field) => {
          return oldPassword ? field.required('Password is required') : field;
        }),
      confirmPassword: Yup.string().when('password', (password, field) => {
        return password
          ? field
              .required('Confirm password is required')
              .oneOf([Yup.ref('password')], 'not equal')
          : field;
      }),
    });

    schema.validate(req.body, { abortEarly: false }).catch(error => {
      [errorMessage] = error.errors;
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ error: errorMessage || 'Password not equal' });
    }

    const { email, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if (email !== user.email) {
      const userExists = User.findOne({ where: { email } });

      if (userExists) {
        return res.status(401).json({ error: 'Usuario ja existe' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Senha invalida' });
    }

    const { id, name } = await user.update(req.body);

    return res.status(200).json({ id, name, email });
  }
}

export default new UserController();

import * as Yup from 'yup';

import Plain from '../models/Plain';

class PlainController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const plans = await Plain.findAll({
      attributes: ['title', 'duration', 'price'],
      limit: 20,
      offset: (page - 1) * 20,
      order: ['id'],
      where: {
        canceled_at: null,
      },
    });
    return res.json({ plans });
  }

  async store(req, res) {
    let errorMessage = '';

    const schema = Yup.object().shape({
      title: Yup.string().required('Title is required'),
      duration: Yup.number()
        .typeError('Duration must be a number')
        .positive('Duration must be positive')
        .integer('Duration must be an integer')
        .required('Duration is required'),
      price: Yup.number()
        .typeError('Price must be a number')
        .positive('Price must be positive')
        .required('Price is required'),
    });

    await schema.validate(req.body, { abortEarly: false }).catch(error => {
      [errorMessage] = error.errors;
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: errorMessage });
    }

    const planExists = await Plain.findOne({
      where: {
        title: req.body.title,
        canceled_at: null,
      },
    });

    if (planExists) {
      return res.status(400).json({ error: 'Plan already exists' });
    }

    const { id, title, duration, price } = await Plain.create(req.body);

    return res.json({
      id,
      title,
      duration,
      price,
    });
  }

  async update(req, res) {
    let errorMessage = '';
    const { id } = req.params;
    const schema = Yup.object().shape({
      title: Yup.string(),
      duration: Yup.number()
        .typeError('Duration must be a number')
        .positive('Duration must be positive')
        .integer('Duration must be an integer'),
      price: Yup.number()
        .typeError('Duration must be a number')
        .positive('Duration must be positive'),
    });

    await schema.validate(req.body, { abortEarly: false }).catch(error => {
      [errorMessage] = error.errors;
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: errorMessage });
    }

    const { title } = req.body;
    const plan = await Plain.findByPk(id);

    if (!plan) {
      return res.status(400).json({ error: 'Plan does not exist' });
    }

    if (title !== plan.title) {
      const planExists = await Plain.findOne({
        where: { title },
      });

      if (planExists) {
        return res.status(400).json({ error: "Plan's name already exists" });
      }
    }

    const { duration, price } = await plan.update(req.body);

    return res.json({
      id,
      title,
      duration,
      price,
    });
  }

  async delete(req, res) {
    const { id } = req.params;

    const plan = await Plain.findByPk(id);

    if (!plan) {
      return res.status(400).json({ error: 'Plan does not exist' });
    }

    plan.canceled_at = new Date();

    await plan.save();

    return res.json({ plan });
  }
}

export default new PlainController();

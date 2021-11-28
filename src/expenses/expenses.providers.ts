import { Connection } from 'mongoose';
import { ExpensesSchema } from './expenses.schema';

export const expensesProviders = [
  {
    provide: 'EXPENSES_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('expenses', ExpensesSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];

import Amadeus from 'amadeus';

const isProduction = process.env.NODE_ENV === 'production';

export const amadeus = new Amadeus({
  clientId: isProduction ? '5v4qAUOvNrAE0DKEvHFi9On5KM4c5mD1' : 'r0crDqGd5OaacbQD0LRspXkSu2I4eWSE',
  clientSecret: isProduction ? 'mvoeMRpVhsIAxseJ' : 'Put1RlnJlOax8ojf'
}); 
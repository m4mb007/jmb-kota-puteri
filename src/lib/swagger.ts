import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api', // define api folder
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'JMB Idaman Kota Puteri API',
        version: '1.0.0',
        description: 'API untuk Portal JMB Idaman Kota Puteri',
        contact: {
          name: 'IT Department',
        },
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [],
    },
  });
  return spec;
};

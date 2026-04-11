import { useForm } from '@tanstack/react-form';

import InputText from '@components/InputText';

const Form = () => {
  const form = useForm({
    defaultValues: {
      image_url: '', // will add later
      name: '',
      description: '',
    },
    onSubmit: async ({ value }) => {
      console.log(value);
    },
  });

  return (
    <div className="space-y-6 pt-6 pb-5">
      <form
        id="study-hub-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) =>
              !value
                ? 'Name is required!'
                : value.length < 3
                  ? 'Name must be at least 3 characters'
                  : undefined,
          }}
          children={(field) => (
            <div>
              <InputText field={field} label="Name:" />
            </div>
          )}
        />
        <form.Field
          name="description"
          validators={{
            onChange: ({ value }) =>
              !value
                ? 'Description is required!'
                : value.length < 30
                  ? 'description must be at least 30 characters'
                  : undefined,
          }}
          children={(field) => (
            <div className="mt-2">
              <InputText field={field} label="Description:" as="textarea" />
            </div>
          )}
        />
      </form>
    </div>
  );
};

export default Form;

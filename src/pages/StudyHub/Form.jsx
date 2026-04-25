import { useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createCourse } from '@api/courses';
import { useDrawer } from '@hooks/useDrawer';
import InputText from '@components/InputText';

const Form = () => {
  const { closeDrawer, setIsPending } = useDrawer();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      closeDrawer();
    },
  });

  useEffect(() => {
    setIsPending(isPending);
  }, [isPending, setIsPending]);

  const form = useForm({
    defaultValues: {
      image_url: '',
      name: '',
      description: '',
    },
    onSubmit: ({ value }) => mutate(value),
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
              <InputText field={field} label="Name:" autoComplete="on" />
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
                  ? 'Description must be at least 30 characters'
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

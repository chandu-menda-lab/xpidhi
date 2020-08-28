import React from 'react';
import {
  Button,
  Form,
  Icon,
  Message,
  Segment,
  FormInput,
} from 'semantic-ui-react';
import Link from 'next/link';
import catchErrors from '../utils/catchErrors';
import axios from 'axios';
import baseUrl from '../utils/baseUrl';
import { handleLogin } from '../utils/auth';

const INITIAL_USER = {
  firstName: '',
  fatherName: '',
  motherName: '',
  lastName: '',
  email: '',
  password: '',
};

function Signup() {
  const [user, setUser] = React.useState(INITIAL_USER);
  const [disabled, setDisabled] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const isUser = Object.values(user).every((el) => Boolean(el));
    isUser ? setDisabled(false) : setDisabled(true);
  }, [user]);

  function handleChangeText(event) {
    const { name, value } = event.target;
    setUser((prevState) => ({ ...prevState, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      //console.log(user);
      //make a request to signup user
      const url = `${baseUrl}/api/signup`;
      const payload = { ...user };
      const response = await axios.post(url, payload);
      handleLogin(response.data);
    } catch (error) {
      catchErrors(error, setError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Message
        attached
        icon='settings'
        header='Get Started!'
        content='Create a new account'
        color='teal'
      />
      <Form loading={loading} onSubmit={handleSubmit} error={Boolean(error)}>
        <Message error header='Oops!' content={error} />
        <Segment>
          <FormInput
            fluid
            icon='user'
            iconPosition='left'
            label='First Name'
            placeholder='First Name'
            name='firstName'
            value={user.firstName}
            onChange={handleChangeText}
          />
          <FormInput
            fluid
            icon='user'
            iconPosition='left'
            label='fatherName'
            placeholder='fatherName'
            name='fatherName'
            onChange={handleChangeText}
          />
          <FormInput
            fluid
            icon='user'
            iconPosition='left'
            label='Mother Name'
            placeholder='Mother Name'
            name='motherName'
            onChange={handleChangeText}
          />
          <FormInput
            fluid
            icon='user'
            iconPosition='left'
            label='Last Name'
            placeholder='Last Name'
            name='lastName'
            onChange={handleChangeText}
          />
          <FormInput
            fluid
            icon='envelope'
            iconPosition='left'
            label='Email'
            placeholder='Email'
            name='email'
            type='email'
            onChange={handleChangeText}
          />
          <FormInput
            fluid
            icon='lock'
            iconPosition='left'
            label='Password'
            placeholder='Password'
            name='password'
            type='password'
            onChange={handleChangeText}
          />
          <Button
            disabled={disabled || loading}
            icon='signup'
            type='submit'
            color='orange'
            content='Signup'
          />
        </Segment>
      </Form>
      <Message attached warning>
        <Icon name='help' />
        Existing user?{' '}
        <Link href='/login'>
          <a>Log in here</a>
        </Link>{' '}
        instead.
      </Message>
    </>
  );
}

export default Signup;

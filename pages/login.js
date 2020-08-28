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
  email: '',
  password: '',
};

function Login() {
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
    setUser((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      console.log(user);
      //make a request to signup user
      const url = `${baseUrl}/api/login`;
      const payload = {
        ...user,
      };
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
        icon='privacy'
        header='Welcome back!'
        content='Log in with email and password'
        color='blue'
      />
      <Form loading={loading} onSubmit={handleSubmit} error={Boolean(error)}>
        <Message error header='Oops!' content={error} />
        <Segment>
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
            icon='sign in'
            type='submit'
            color='orange'
            content='Login'
          />
        </Segment>
      </Form>
      <Message attached warning>
        <Icon name='help' />
        New user ?{' '}
        <Link href='/signup'>
          <a> Sign up here </a>
        </Link>{' '}
        instead.{' '}
      </Message>
    </>
  );
}

export default Login;

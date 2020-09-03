import React from 'react';
import {
  Button,
  Form,
  Radio,
  Message,
  Segment,
  FormInput,
  Dropdown,
  Label,
} from 'semantic-ui-react';
import catchErrors from '../utils/catchErrors';
import axios from 'axios';
import baseUrl from '../utils/baseUrl';
import cookie from 'js-cookie';

const INITIAL_USER_RELATION = {
  firstName: '',
  lastName: '',
  email: '',
  relationType: '',
};

const RELATION_TYPE_OPTIONS = [
  {
    key: 'partners',
    text: 'Partner',
    value: 'partners',
    //        image: { avatar: true, src: '/images/avatar/small/jenny.jpg' },
  },
  {
    key: 'parents',
    text: 'Parent',
    value: 'parents',
    //        image: { avatar: true, src: '/images/avatar/small/elliot.jpg' },
  },
  {
    key: 'childrens',
    text: 'Children',
    value: 'childrens',
    //        image: { avatar: true, src: '/images/avatar/small/stevie.jpg' },
  },
  {
    key: 'siblings',
    text: 'Sibling',
    value: 'siblings',
    //        image: { avatar: true, src: '/images/avatar/small/stevie.jpg' },
  },
];

function Create({ handleRelation, selectedLevel, selectedNodeId }) {
  const [userRelation, setUserRelation] = React.useState(INITIAL_USER_RELATION);
  const [disabled, setDisabled] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const isUserRelation = Object.values(userRelation).every((el) =>
      Boolean(el)
    );
    isUserRelation ? setDisabled(false) : setDisabled(true);
  }, [userRelation]);

  function handleChangeText(event) {
    const { name, value } = event.target;
    setUserRelation((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }

  function handleChangeSelect(event, data) {
    const { name, value } = data;
    setUserRelation((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    console.log(userRelation);
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      //console.log(user);
      //make a request to signup user
      const url = `${baseUrl}/api/relation`;
      const token = cookie.get('token');
      const payload = {
        ...userRelation,
        ...{ selectedLevel },
        ...{ selectedNodeId },
      };
      const headers = {
        headers: {
          Authorization: token,
        },
      };
      const response = await axios.post(url, payload, headers);
      //console.log(response);
      handleRelation(response, userRelation.relationType);
      // handleCreateTree();
      // handleCreateRelation(response.data);
    } catch (error) {
      catchErrors(error, setError);
    } finally {
      setLoading(false);
    }
  }

  function handleCreateTree() {
    console.log('handleCreateTree');
  }

  return (
    <>
      <Message
        attached
        icon='settings'
        header='Get Started!'
        content='Create a new relation'
        color='teal'
      />
      <Form loading={loading} onSubmit={handleSubmit} error={Boolean(error)}>
        <Message error header='Oops!' content={error} />{' '}
        <Segment>
          <Dropdown
            placeholder='Select Relation Type'
            name='relationType'
            fluid
            selection
            options={RELATION_TYPE_OPTIONS}
            onChange={handleChangeSelect}
          />{' '}
          <FormInput
            fluid
            icon='user'
            iconPosition='left'
            label='First Name'
            placeholder='First Name'
            name='firstName'
            value={userRelation.firstName}
            onChange={handleChangeText}
          />{' '}
          <FormInput
            fluid
            icon='user'
            iconPosition='left'
            label='Last Name'
            placeholder='Last Name'
            name='lastName'
            onChange={handleChangeText}
          />{' '}
          <FormInput
            fluid
            icon='envelope'
            iconPosition='left'
            label='Email'
            placeholder='Email'
            name='email'
            type='email'
            onChange={handleChangeText}
          />{' '}
          <Radio toggle label='Live status' />
          <div>
            <Button
              disabled={disabled || loading}
              icon=''
              type='submit'
              color='orange'
              content='Create'
            />
          </div>{' '}
        </Segment>{' '}
      </Form>{' '}
    </>
  );
}

export default Create;

import React from 'react';
import {
  Button,
  Grid,
  Label,
  Modal,
  Segment,
  Image,
  ModalActions,
} from 'semantic-ui-react';
import axios from 'axios';
import baseUrl from '../utils/baseUrl';
import { start } from 'nprogress';
import Create from './create';
import cookie from 'js-cookie';

const FAMILY_TREE_DATA = {
  selectedNode: '',
  selectedLevel: '',
  selectedNodeId: '',
  startTop: '',
  email: '',
  relationType: '',
  gap: 128,
  size: 64,
  data: [],
};

const PERSON = {
  _id: '',
  name: '',
  partners: [],
  siblings: [],
  parents: [],
  childrens: [],
  level: 0,
  root: false,
  className: '',
};
const DATA = [];
const ELEMENTS = [];
const LEVELS = [];
const LEVELMAP = [];

function exampleReducer(state, action) {
  switch (action.type) {
    case 'CLEAR_LOG':
      return { ...state, log: [] };
    case 'OPEN_MODAL':
      return {
        log: [
          {
            event: action.event,
            date: new Date().toLocaleTimeString(),
            name: action.name,
            value: true,
          },
          ...state.log,
        ],
        open: true,
      };
    case 'CLOSE_MODAL':
      return {
        log: [
          {
            event: action.event,
            date: new Date().toLocaleTimeString(),
            name: action.name,
            value: true,
          },
          ...state.log,
        ],
        open: false,
      };
    default:
      throw new Error();
  }
}

function Home({ user }) {
  const [userDetails] = React.useState(user);
  const [familyTree, setFamilyTree] = React.useState(FAMILY_TREE_DATA);
  const [personDetails, setPersonDetails] = React.useState(PERSON);
  const [tree, setTree] = React.useState(false);
  const [people, setPeople] = React.useState(false);
  const [addRelationFlag, setAddRelationFlag] = React.useState(false);
  const [data, setData] = React.useState(DATA);
  const [elements, setElements] = React.useState(ELEMENTS);
  const [levels, setLevels] = React.useState(LEVELS);
  const [levelMap, setLevelMap] = React.useState(LEVELMAP);
  const [referencePerson, setReferencePerson] = React.useState(false);
  const [tempSibling, setTempSibling] = React.useState(false);
  const [assignParentsFlag, setAssignParentsFlag] = React.useState(false);

  const [state, dispatch] = React.useReducer(exampleReducer, {
    log: [],
    open: false,
  });
  const { log, open } = state;

  React.useEffect(() => {
    console.log('useEffect has been called!');
    init();
    getUserFamilyTree();
    //createPerson();
  }, []);

  React.useEffect(() => {
    console.log('useEffect tree ======');
    console.log(tree);

    // Approximate center of the div
    familyTree.startTop = parseInt(tree.clientHeight / 2 - familyTree.size / 2);
    familyTree.startLeft = parseInt(tree.clientWidth / 2 - familyTree.size / 2);
    console.log('familyTree.startTop=========' + familyTree.startTop);
  }, [tree]);

  React.useEffect(() => {
    console.log('useEffect personDetails======');
    console.log(personDetails);

    if (personDetails._id != '') {
      if (!personDetails.root) {
        addPerson(familyTree.relationType);
        plotTree();
      }
    }
  }, [personDetails.name]);

  React.useEffect(() => {
    console.log(':::useEffect::::  FamiltyTree');
    console.log(familyTree.data);

    if (familyTree.data.length > 0 && familyTree.data[0]._id != '') {
      // Plot the tree
      plotTree();

      // Pre-select the root node
      var selectedNode = get('5f3ff33af8197a3a2c0f0306');
      if (selectedNode != null)
        document.getElementById('title').innerText = selectedNode.innerText;
    }
  }, [familyTree.data]);

  React.useEffect(() => {
    if (familyTree.selectedNode) {
      var selectedNode = familyTree.selectedNode;
      select(selectedNode);
      document.getElementById('title').innerText = selectedNode.innerText;
      fillPeopleAtLevel();
    }
  }, [familyTree.selectedNode]);

  React.useEffect(() => {
    const aboutContoller = new AbortController();
    if (familyTree.relationType === 'childrens') {
      addPerson(familyTree.relationType);
      var childId = personDetails._id;
      var parentId = referencePerson._id;
      updatePerson(childId, 'parents', parentId);
      plotTree();
    } else if (familyTree.relationType === 'siblings') {
      // Creating Mother
      createParents(personDetails._id);
      //plotTree();
    }

    return function cleanup() {
      aboutContoller.abort();
    };
  }, [referencePerson]);

  function init() {
    setTree(document.getElementById('tree'));
    setPeople(document.getElementById('people'));
  }

  async function getUserFamilyTree() {
    const url = `${baseUrl}/api/familyTree`;
    const token = cookie.get('token');
    const headers = {
      headers: {
        Authorization: token,
      },
    };
    const response = await axios.get(url, headers);
    setFamilyTree((prevState) => ({
      ...prevState,
      data: response.data,
    }));

    const familyTreeDetails = response.data;
    setPersonDetails((prevState) => ({
      ...prevState,
      _id: familyTreeDetails._id,
      name: familyTreeDetails.name,
      root: true,
    }));
  }

  function startFresh() {
    // Reset Data Cache
    var data = [];
    init();
    //createPerson();
    //getUserFamilyTree();
  }

  /* Start a fresh tree */
  function createPerson() {
    // Add a root "me" person to start with
    const familyTreeDetails = familyTree.data[0];
    setPersonDetails((prevState) => ({
      ...prevState,
      _id: familyTreeDetails._id,
      name: familyTreeDetails.name,
      root: true,
    }));
  }

  /* Plot entire tree from bottom-up */
  function plotTree() {
    var data = familyTree.data;
    console.log('data::::::::::::::');
    console.log(data);
    //let data = familyTree.data;

    // Reset other cache and DOM
    setElements([]);
    setLevels([]);
    setLevelMap([]);
    while (tree.hasChildNodes()) {
      tree.removeChild(tree.lastChild);
    }

    // Get all the available levels from the data
    data.forEach(function (elem) {
      if (levels.indexOf(elem.level) === -1) {
        levels.push(elem.level);
      }
    });

    // Sort the levels in ascending order
    levels.sort(function (a, b) {
      return a - b;
    });

    // For all level starting from lowest one
    levels.forEach(function (level) {
      // Get all persons from this level
      var startAt = data.filter(function (person) {
        return person.level == level;
      });
      console.log('startAt');
      console.log(startAt);
      startAt.forEach(function (start) {
        var person = getPerson(start._id);
        // Plot each person in this level
        plotNode(person, 'self');
        // Plot partners
        plotPartners(person);
        // And plot the parents of this person walking up
        plotParents(person);
      });
    });

    // Adjust coordinates to keep the tree more or less in center
    adjustNegatives();
  }

  /* Plot partners for the current person */
  function plotPartners(start) {
    if (!start) {
      return;
    }
    start.partners.forEach(function (partnerId) {
      var partner = getPerson(partnerId);
      //console.log(partner);
      if (partner != undefined) {
        // Plot node
        plotNode(partner, 'partners', start);
        // Plot partner connector
        plotConnector(start, partner, 'partners');
      }
    });
  }

  function plotParents(start) {
    if (!start) {
      return;
    }

    console.log('plotParents');
    console.log(start.parents);

    start.parents.reduce(function (previousId, currentId) {
      var previousParent = getPerson(previousId),
        currentParent = getPerson(currentId);
      console.log(previousParent);
      console.log(currentParent);
      // Plot node
      plotNode(currentParent, 'parents', start, start.parents.length);
      // Plot partner connector if multiple parents
      if (previousParent) {
        plotConnector(previousParent, currentParent, 'partners');
      }
      // Plot parent connector
      plotConnector(start, currentParent, 'parents');
      // Recurse and plot parent by walking up the tree
      plotParents(currentParent);
      return currentId;
    }, 0);
  }

  /* Plot a single node */
  function plotNode() {
    console.log('plotNode');
    console.log(arguments);
    var person = arguments[0],
      relationType = arguments[1],
      relative = arguments[2],
      numberOfParents = arguments[3],
      node = get(person._id),
      relativeNode,
      element = {},
      thisLevel,
      exists;
    if (node) {
      return;
    }
    node = createNodeElement(person);
    // Get the current level
    thisLevel = findLevel(person.level);
    if (!thisLevel) {
      thisLevel = { level: person.level, top: familyTree.startTop };
      levelMap.push(thisLevel);
    }
    // Depending on relation determine position to plot at relative to current person
    if (relationType == 'self') {
      node.style.left = familyTree.startLeft + 'px';
      node.style.top = thisLevel.top + 'px';
    } else {
      relativeNode = get(relative._id);
    }
    console.log('node');
    console.log(node);

    if (relationType == 'partners') {
      // Plot to the right
      node.style.left =
        parseInt(relativeNode.style.left) +
        familyTree.size +
        familyTree.gap * 1 +
        'px'; //@Chandu- for node space adjustment
      node.style.top = parseInt(relativeNode.style.top) + 'px';
    }
    if (relationType == 'childrens') {
      // Plot below
      node.style.left =
        parseInt(relativeNode.style.left) - familyTree.size + 'px';
      node.style.top =
        parseInt(relativeNode.style.top) +
        familyTree.size +
        familyTree.gap +
        'px';
    }
    if (relationType == 'parents') {
      // Plot above, if single parent plot directly above else plot with an offset to left
      if (numberOfParents == 1) {
        node.style.left = parseInt(relativeNode.style.left) + 'px';
        node.style.top =
          parseInt(relativeNode.style.top) -
          familyTree.gap -
          familyTree.size +
          'px';
      } else {
        node.style.left =
          parseInt(relativeNode.style.left) - familyTree.size + 'px';
        node.style.top =
          parseInt(relativeNode.style.top) -
          familyTree.gap -
          familyTree.size +
          'px';
      }
    }

    // Avoid collision moving to right
    while ((exists = detectCollision(node))) {
      node.style.left =
        exists.left + familyTree.size + familyTree.gap * 1 + 'px'; //@Chandu- for node space adjustment
    }

    // Record level position
    if (thisLevel.top > parseInt(node.style.top)) {
      updateLevel(person.level, 'top', parseInt(node.style.top));
    }
    element.id = node.id;
    element.left = parseInt(node.style.left);
    element.top = parseInt(node.style.top);
    elements.push(element);
    //console.log(node);
    // Add the node to the DOM tree
    tree.appendChild(node);
  }

  function plotConnector(source, destination, relation) {
    var connector = document.createElement('div'),
      orientation,
      comboId,
      comboIdInverse,
      start,
      stop,
      x1,
      y1,
      x2,
      y2,
      length,
      angle,
      transform,
      exists;
    // We do not plot a connector if already present
    comboId = source._id + '-' + destination._id;
    comboIdInverse = destination._id + '-' + source._id;
    if (document.getElementById(comboId)) {
      return;
    }
    if (document.getElementById(comboIdInverse)) {
      return;
    }

    connector.id = comboId;
    orientation = relation == 'partners' ? 'h' : 'v';
    connector.classList.add('asset');
    connector.classList.add('connector');
    connector.classList.add(orientation);
    // console.log('source.id == destination.id');
    // console.log(source.id + '==' + destination.id);
    start = get(source._id);
    stop = get(destination._id);

    if (relation == 'partners' && destination._id !== '') {
      x1 = parseInt(start.style.left) + familyTree.size;
      y1 = parseInt(start.style.top) + familyTree.size / 2;
      x2 = parseInt(stop.style.left);
      y2 = parseInt(stop.style.top);
      length = x2 - x1 + 'px';

      connector.style.width = length;
      connector.style.left = x1 + 'px';
      connector.style.top = y1 + 'px';
      //console.log(connector);
      // Avoid collision moving down
      while ((exists = detectConnectorCollision(connector))) {
        connector.style.top = parseInt(exists.style.top) + 4 + 'px';
      }
    }
    if (relation == 'parents') {
      x1 = parseInt(start.style.left) + familyTree.size / 2;
      y1 = parseInt(start.style.top);
      x2 = parseInt(stop.style.left) + familyTree.size / 2;
      y2 = parseInt(stop.style.top) + (familyTree.size - 2);

      length = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
      angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
      transform = 'rotate(' + angle + 'deg)';

      connector.style.width = length + 'px';
      connector.style.left = x1 + 'px';
      connector.style.top = y1 + 'px';
      connector.style.transform = transform;
    }
    tree.appendChild(connector);
  }

  function detectConnectorCollision(connector) {
    var connectors = [].slice.call(
      document.querySelectorAll('div.connector.h')
    );
    var element = connectors.filter(function (elem) {
      return (
        elem.style.left == connector.style.left &&
        elem.style.top == connector.style.top
      );
    });
    return element.pop();
  }

  function detectCollision(node) {
    var element = elements.filter(function (elem) {
      var left = parseInt(node.style.left);
      return (
        (elem.left == left ||
          (elem.left < left &&
            left < elem.left + familyTree.size + familyTree.gap)) &&
        elem.top == parseInt(node.style.top)
      );
    });
    return element.pop();
  }

  function adjustNegatives() {
    var allNodes = document.querySelectorAll('div.asset'),
      minTop = familyTree.startTop,
      diff = 0;
    for (var i = 0; i < allNodes.length; i++) {
      if (parseInt(allNodes[i].style.top) < minTop) {
        minTop = parseInt(allNodes[i].style.top);
      }
    }
    if (minTop < familyTree.startTop) {
      diff = Math.abs(minTop) + familyTree.gap;
      for (var i = 0; i < allNodes.length; i++) {
        allNodes[i].style.top = parseInt(allNodes[i].style.top) + diff + 'px';
      }
    }
  }

  function fillPeopleAtLevel() {
    var selectedNode = familyTree.selectedNode;
    var data = familyTree.data;
    console.log(':::selectedNode:::');
    console.log(selectedNode);
    // console.log(data);

    if (!selectedNode) return;
    var people = people;
    var person = getPerson(selectedNode.id),
      level = person.level + 1,
      persons,
      option;
    var parentsArray = person.parents;
    var personDetails;
    var partnersArray = [];

    parentsArray.forEach(function (id) {
      personDetails = getPerson(id);
      if (partnersArray.length == 0) {
        partnersArray = personDetails.partners;
      } else {
        console.log('Partners Else');
        //$.merge(partnersArray, personDetails.partners);
      }
    });
    console.log('people::::');
    console.log(people);
    console.log(tree);
    // while (people.hasChildNodes()) {
    //   people.removeChild(people.lastChild);
    // }

    data.forEach(function (elem) {
      if (elem.level === level) {
        //if (elem.level === level && $.inArray(elem.id, partnersArray) > -1) {
        option = document.createElement('option');
        option.value = elem._id;
        option.textContent = elem.name;
        //people.appendChild(option);
      }
    });
    return persons;
  }

  /* Helper Functions */

  function createNodeElement(person) {
    var node = document.createElement('div');
    node.classList.add('node');
    node.classList.add('asset');
    node.id = person._id;
    node.textContent = person.name;
    node.setAttribute('data-level', person.level);
    return node;
  }

  function addRelation(id, relationType, newPerson) {
    var data = familyTree.data;
    console.log(newPerson);
    data.forEach(function (person) {
      if (person[relationType].indexOf(id) != -1) {
        person[relationType].push(newPerson._id);
        newPerson[relationType].push(person._id);
      }
    });
    return newPerson;
  }

  function findLevel(level) {
    var element = levelMap.filter(function (elem) {
      return elem.level === level;
    });
    return element.pop();
  }

  function updateLevel(id, key, value) {
    levelMap.forEach(function (level) {
      if (level.level === id) {
        level[key] = value;
      }
    });
  }

  function select(selectedNode) {
    var allNodes = document.querySelectorAll('div.node');
    [].forEach.call(allNodes, function (node) {
      node.classList.remove('selected');
    });
    selectedNode.classList.add('selected');
  }

  function get(id) {
    return document.getElementById(id);
  }

  async function getPersonTreeDetails(id) {
    const url = `${baseUrl}/api/familyTree`;
    const token = cookie.get('token');
    const headers = {
      headers: {
        Authorization: token,
      },
    };
    const payload = {
      params: {
        _id: id,
      },
    };
    const personTreDetails = await axios.get(url, headers, payload);
    console.log('::getPerson::');
    console.log(personTreDetails);

    let data = familyTree.data;
    console.log('::getPerson::');
    console.log(data);
    var element = data.filter(function (elem) {
      return elem._id == id;
    });
    return element.pop();
  }

  function getPerson(id) {
    let data = familyTree.data;
    console.log('::getPerson::');
    console.log(data);
    var element = data.filter(function (elem) {
      return elem._id == id;
    });
    return element.pop();
  }

  function addPerson(relationType) {
    var selectedNode = familyTree.selectedNode;
    console.log('selectedNode');
    console.log(selectedNode);
    var data = familyTree.data;
    var newId = personDetails._id;

    console.log('personDetails');
    console.log(personDetails);

    var newPerson = personDetails,
      thisPerson;
    thisPerson = getPerson(selectedNode._id);

    console.log('newPerson');
    console.log(newPerson);
    console.log('thisPerson');
    console.log(thisPerson);
    // Add relation between originating person and this person
    updatePerson(thisPerson._id, relationType, newId);
    switch (relationType) {
      case 'childrens':
        newPerson.parents.push(thisPerson._id);
        newPerson.level = thisPerson.level - 1;
        break;
      case 'partners':
        newPerson.partners.push(thisPerson._id);
        newPerson.level = thisPerson.level;
        break;
      case 'siblings':
        newPerson.siblings.push(thisPerson._id);
        newPerson.level = thisPerson.level;
        // Add relation for all other relatives of originating person
        newPerson = addRelation(thisPerson._id, relationType, newPerson);
        newPerson.parents = thisPerson.parents; // updated parents
        break;
      case 'parents':
        newPerson.childrens.push(thisPerson._id);
        newPerson.level = thisPerson.level + 1;
        break;
    }
    data.push(newPerson);
    console.log(data);

    if (relationType == 'parents' && tempSibling !== false) {
      var siblingDetails = getPerson(tempSibling._id);
      if (siblingDetails.parents.length < 2) {
        generateNewPerson();
        setReferencePerson(tempSibling);
        updatePerson(tempSibling._id, 'parents', newPerson._id);
      }
    }

    //Start @Chandu - Created default child for parents
    if (relationType == 'partners') {
      console.log('partners===================');
      setFamilyTree((prevState) => ({
        ...prevState,
        relationType: 'childrens',
      }));
      generateNewPerson();
      setReferencePerson(newPerson);
    }
    //End @Chandu - Created default child for parents

    //Start @Chandu - Created default Parents when we create sibling
    if (relationType == 'siblings') {
      var siblingDetails = getPerson(newPerson.siblings[0]);
      setTempSibling(newPerson);

      if (siblingDetails.parents.length == 0) {
        setFamilyTree((prevState) => ({
          ...prevState,
          relationType: 'parents',
        }));

        generateNewPerson();
        setReferencePerson(newPerson);
        // Creating Mother
        // createParents(newPerson.id);
      } else {
        console.log('Else If');
        setFamilyTree((prevState) => ({
          ...prevState,
          relationType: 'parents',
        }));

        generateNewPerson();
        setReferencePerson(newPerson);
        // updateExistingParents(
        //   newId,
        //   'parents',
        //   newPerson.id,
        //   siblingDetails.parents
        // );
      }

      // if (siblingDetails.parents.length < 2) {
      //   generateNewPerson();
      //   setReferencePerson(newPerson);

      //   // Creating Father
      //   // createParents(newPerson.id);
      // }

      plotTree();
    }
    //End @Chandu - Created default Parents when we create sibling
  }

  //Start @Chandu - new methods created
  function createParents(newParentId) {
    console.log('createParents');
    var data = familyTree.data;
    addPerson('parents');
    //var referenceId = 'P' + (data.length < 9 ? '0' + data.length : data.length);
    var referenceId = referencePerson._id;

    updatePerson(newParentId, 'parents', referenceId);
    updatePerson(referenceId, 'childrens', newParentId);

    return;
  }

  function updateExistingParents(id, key, value, attachParentArray) {
    console.log('id::' + id);
    console.log('key::' + key);
    console.log('value::' + value);
    var data = familyTree.data;
    data.forEach(function (person) {
      console.log(person);
      if (person._id === id) {
        if (person[key].constructor === Array) {
          person[key] = attachParentArray;
        } else if (person[key].constructor === Array) {
          person[key].push(value);
        } else {
          person[key] = value;
        }
      }
    });
    console.log('===============');
  }

  function updatePerson(id, key, value) {
    var data = familyTree.data;
    data.forEach(function (person) {
      if (person._id === id) {
        if (person[key].constructor === Array) {
          person[key].push(value);
        } else if (person[key].constructor === Array) {
          person[key].push(value);
        } else {
          person[key] = value;
        }
      }
    });
  }

  function handleChangeText(event) {
    const { name, value } = event.target;

    setFamilyTree((prevState) => ({ ...prevState, [name]: value }));
    console.log(familyTree);
  }

  function handleNodeNameChange(e) {
    data.map((treeNode) => {
      console.log(treeNode);
      if (treeNode._id === familyTree.selectedNode._id) {
        console.log('e.target.value');
        console.log(e.target.value);

        // setFamilyTree((prevState) => ({
        //   ...prevState,
        //   selectedNode: e.target,
        // }));
        return { id: familyTree.selectedNode._id, value: e.target.value };
      }
      return treeNode;
    });

    // const { name, value } = event.target;
    //setData((prevState) => ({ ...prevState, [name]: value }));
    console.log(data);
  }

  function generateNewPerson() {
    if (arguments.length == 1) {
      const newRelationTreeDetails = arguments[0];
      setPersonDetails((prevState) => ({
        ...prevState,
        _id: newRelationTreeDetails._id,
        name: newRelationTreeDetails.name,
        parents: newRelationTreeDetails.parents,
        partners: newRelationTreeDetails.partners,
        siblings: newRelationTreeDetails.siblings,
        childrens: newRelationTreeDetails.childrens,
        root: false,
      }));
    } else {
      var data = familyTree.data;
      console.log(data);
      var newId =
        'P' + (data.length < 9 ? '0' + (data.length + 1) : data.length + 1);
      console.log('@@@@@@newId::' + newId);
      setPersonDetails((prevState) => ({
        ...prevState,
        _id: newId,
        name: newId,
        parents: [],
        partners: [],
        siblings: [],
        childrens: [],
        root: false,
      }));
    }
  }

  function handleNode(event) {
    console.log('::handleNode::');
    const { target } = event;

    if (event.target.classList.contains('node')) {
      setAddRelationFlag(true);

      setFamilyTree((prevState) => ({
        ...prevState,
        selectedNode: target,
        selectedLevel: target.getAttribute('data-level'),
        selectedNodeId: target.getAttribute('id'),
      }));
    }
  }

  function handleAddRelation(newValue, relationType) {
    console.log('::handleAddRelation::');
    console.log(newValue);
    console.log('relationType');
    console.log(relationType);

    setFamilyTree((prevState) => ({
      ...prevState,
      relationType: relationType,
    }));
    setAddRelationFlag(false);
    closeModal();
    //generateNewPerson(newValue);
  }

  function openModal() {
    dispatch({ event: 'click', name: 'onOpen', type: 'OPEN_MODAL' });
  }

  function closeModal() {
    dispatch({
      event: 'click',
      name: 'onClose',
      type: 'CLOSE_MODAL',
    });
  }

  function assignParents() {
    setAssignParentsFlag(true);
    console.log('================people');
    console.log(people);
  }

  //console.log(personDetails);
  return (
    <>
      <h2 id='title'>Me</h2>
      <Grid celled='internally'>
        <Grid.Row>
          <Grid.Column width={12}>
            <Button onClick={startFresh}>Clear</Button>
            <Button onClick={openModal}>Add Relation</Button>
            <Button onClick={assignParents}>Assign Parents</Button>
          </Grid.Column>
          {assignParentsFlag ? (
            <>
              <Grid.Column width={6}>
                <label>Add Parents: </label>
                <select id='people' name='addParents[]' multiple></select>
                <button id='addExisting'>As Parent</button>
              </Grid.Column>
            </>
          ) : (
            <></>
          )}
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={12}>
            <Modal onOpen={openModal} onClose={closeModal} open={open}>
              <Modal.Header>Add Relation</Modal.Header>
              <Modal.Content>
                <Create
                  handleRelation={handleAddRelation}
                  selectedLevel={familyTree.selectedLevel}
                  selectedNodeId={familyTree.selectedNodeId}
                />
                {/* {addRelationFlag ? (
                  <Create handleRelation={handleAddRelation} />
                ) : (
                  <></>
                )} */}
              </Modal.Content>
              <ModalActions></ModalActions>
            </Modal>

            <div id='tree' onClick={handleNode}></div>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </>
  );
}

Home.getInitialProps = async () => {
  console.log('Home page');

  return { familyTreeObj: {} };
};

export default Home;

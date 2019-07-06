import { gql } from "apollo-boost";
import client from "./client";

const cardsQuery = gql`
    query getCards($deckId: ID!) {
      cards(deckId: $deckId) {
        prompt
        target
        promptExample
        targetExample
    }
  }
`;

const cardIdsQuery = gql`
    query getCards($deckId: ID!) {
      cards(deckId: $deckId) {
        prompt
        _id
    }
  }
`;

const addCardMutation = gql`
  mutation CreateNewCard($input: NewCardInput!) {
    newCard(input: $input) {
      prompt
      target
      promptExample
      targetExample
    }
  }
`;

const updateCardMutation = gql`
  mutation UpdateCard($id: ID!, $input: UpdateCardInput!) {
    updateCard(id: $id, input: $input) {
      prompt
      target
      promptExample
      targetExample
    }
  }
`;

const removeCardMutation = gql`
  mutation RemoveCard($id: ID!) {
    removeCard(id: $id) {
      _id
    }
  }
`;

async function addCard(variables) {
  return await client.mutate({ mutation: addCardMutation, variables });
}

async function updateCard(variables) {
  return await client.mutate({ mutation: updateCardMutation, variables });
}

async function removeCard(variables) {
  return await client.mutate({ mutation: removeCardMutation, variables });
}

async function getCardId(prompt, deckId) {
  var data = await client.query({
    query: cardIdsQuery,
    variables: { deckId },
    fetchPolicy: "no-cache"
  });
  var cards = data.data.cards;
  return cards.filter(card => card.prompt == prompt)[0]._id;
}

// helper func to update card in database
async function updateCardInDB(oldData, newData, deckId) {
  var id = await getCardId(oldData.prompt, deckId);
  var variables = {
    input: {
      prompt: newData.prompt,
      target: newData.target,
      promptExample: newData.promptExample,
      targetExample: newData.targetExample
    },
    id,
  };
  try {
    return await updateCard(variables);
  } catch (e) {
    console.log(e);
  }
}

export {
  cardsQuery,
  getCardId,
  addCard,
  updateCard,
  updateCardInDB,
  removeCard
}
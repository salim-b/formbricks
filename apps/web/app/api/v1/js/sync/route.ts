import { getSurveys } from "@/app/api/v1/js/surveys";
import { responses } from "@/lib/api/response";
import { transformErrorToDetails } from "@/lib/api/validator";
import { getActionClasses } from "@formbricks/lib/services/actionClass";
import { createPerson, getPerson } from "@formbricks/lib/services/person";
import { getProductByEnvironmentId } from "@formbricks/lib/services/product";
import { createSession, extendSession, getSession } from "@formbricks/lib/services/session";
import { TJsState, ZJsSyncInput } from "@formbricks/types/v1/js";
import { TPerson } from "@formbricks/types/v1/people";
import { TSession } from "@formbricks/types/v1/sessions";
import { NextResponse } from "next/server";

export async function OPTIONS(): Promise<NextResponse> {
  return responses.successResponse({}, true);
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const jsonInput = await req.json();

    // validate using zod
    const inputValidation = ZJsSyncInput.safeParse(jsonInput);

    if (!inputValidation.success) {
      return responses.badRequestResponse(
        "Fields are missing or incorrectly formatted",
        transformErrorToDetails(inputValidation.error),
        true
      );
    }

    const { environmentId, personId, sessionId } = inputValidation.data;

    if (!personId) {
      // create a new person
      const person = await createPerson(environmentId);
      // get/create rest of the state
      const [session, surveys, noCodeActionClasses, product] = await Promise.all([
        createSession(person.id),
        getSurveys(environmentId, person),
        getActionClasses(environmentId),
        getProductByEnvironmentId(environmentId),
      ]);

      // return state
      const state: TJsState = {
        person,
        session,
        surveys,
        noCodeActionClasses: noCodeActionClasses.filter((actionClass) => actionClass.type === "noCode"),
        product,
      };
      return responses.successResponse({ ...state }, true);
    }

    if (!sessionId) {
      let person: TPerson | null;
      // check if person exists
      person = await getPerson(personId);
      if (!person) {
        // create a new person
        person = await createPerson(environmentId);
      }
      // get/create rest of the state
      const [session, surveys, noCodeActionClasses, product] = await Promise.all([
        createSession(person.id),
        getSurveys(environmentId, person),
        getActionClasses(environmentId),
        getProductByEnvironmentId(environmentId),
      ]);
      // return state
      const state: TJsState = {
        person,
        session,
        surveys,
        noCodeActionClasses: noCodeActionClasses.filter((actionClass) => actionClass.type === "noCode"),
        product,
      };
      return responses.successResponse({ ...state }, true);
    }
    // person & session exists

    // check if session exists
    let person: TPerson | null;
    let session: TSession | null;
    session = await getSession(sessionId);
    if (!session) {
      // check if person exits
      person = await getPerson(personId);
      if (!person) {
        // create a new person
        person = await createPerson(environmentId);
      }
      // create a new session
      session = await createSession(person.id);
    } else {
      // session exists
      // check if person exists (should always exist, but just in case)
      person = await getPerson(personId);
      if (!person) {
        // create a new person & session
        person = await createPerson(environmentId);
        session = await createSession(person.id);
      } else {
        // check if session is expired
        if (session.expiresAt < new Date()) {
          // create a new session
          session = await createSession(person.id);
        } else {
          // extend session
          session = await extendSession(sessionId);
        }
      }
    }

    // get/create rest of the state
    const [surveys, noCodeActionClasses, product] = await Promise.all([
      getSurveys(environmentId, person),
      getActionClasses(environmentId),
      getProductByEnvironmentId(environmentId),
    ]);

    // return state
    const state: TJsState = {
      person,
      session,
      surveys,
      noCodeActionClasses: noCodeActionClasses.filter((actionClass) => actionClass.type === "noCode"),
      product,
    };
    return responses.successResponse({ ...state }, true);
  } catch (error) {
    console.error(error);
    return responses.internalServerErrorResponse(
      "Unable to complete response. See server logs for details.",
      true
    );
  }
}

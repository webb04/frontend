package controllers

import actions.AuthenticatedActions
import com.gu.identity.cookie.GuUCookieData
import com.gu.identity.model.Consent.Supporter
import com.gu.identity.model._
import form._
import idapiclient.{TrackingData, _}
import idapiclient.Auth
import idapiclient.responses.Error
import model.{Countries, PhoneNumbers}
import com.gu.identity.model.EmailNewsletters
import controllers.editprofile.EditProfileController
import org.joda.time.format.ISODateTimeFormat
import org.mockito.Mockito._
import org.mockito.{ArgumentCaptor, Matchers => MockitoMatchers}
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.{DoNotDiscover, Matchers, OptionValues, WordSpec}
import org.scalatest.mockito.MockitoSugar
import org.scalatestplus.play.ConfiguredServer
import play.api.http.HttpConfiguration
import play.api.mvc._
import play.api.test.FakeRequest
import play.api.test.Helpers._
import services._
import test._
import scala.concurrent.Future

//TODO test form validation and population of form fields.
@DoNotDiscover class EditProfileControllerTest extends WordSpec with WithTestExecutionContext
  with Matchers
  with MockitoSugar
  with OptionValues
  with ScalaFutures
  with WithTestApplicationContext
  with WithTestCSRF
  with ConfiguredServer {

  trait EditProfileFixture {

    val controllerComponent: ControllerComponents = play.api.test.Helpers.stubControllerComponents()
    val idUrlBuilder = mock[IdentityUrlBuilder]
    val api = mock[IdApiClient]
    val idRequestParser = mock[IdRequestParser]
    val authService = mock[AuthenticationService]
    val idRequest = mock[IdentityRequest]
    val trackingData = mock[TrackingData]
    val returnUrlVerifier = mock[ReturnUrlVerifier]
    val newsletterService = spy(new NewsletterService(api, idRequestParser, idUrlBuilder))
    val httpConfiguration = HttpConfiguration.createWithDefaults()

    val userId: String = "123"
    val user = User("test@example.com", userId, statusFields = StatusFields(userEmailValidated = Some(true)))
    val testAuth = ScGuU("abc", GuUCookieData(user, 0, None))
    val authenticatedUser = AuthenticatedUser(user, testAuth, true)
    val phoneNumbers = PhoneNumbers

    val authenticatedActions = new AuthenticatedActions(authService, api, mock[IdentityUrlBuilder], controllerComponent, newsletterService, idRequestParser)
    val signinService = mock[PlaySigninService]
    val profileFormsMapping = ProfileFormsMapping(
      new AccountDetailsMapping,
      new PrivacyMapping,
      new ProfileMapping
    )

    when(authService.fullyAuthenticatedUser(MockitoMatchers.any[RequestHeader])) thenReturn Some(authenticatedUser)
    when(api.me(testAuth)) thenReturn Future.successful(Right(user))

    when(idRequestParser.apply(MockitoMatchers.any[RequestHeader])) thenReturn idRequest
    when(idRequest.trackingData) thenReturn trackingData
    when(idRequest.returnUrl) thenReturn None

    when(api.userEmails(MockitoMatchers.anyString(), MockitoMatchers.any[TrackingData])) thenReturn Future.successful(Right(Subscriber("Text", List(EmailList("37")), "subscribed")))

    lazy val controller = new EditProfileController(
      idUrlBuilder,
      authenticatedActions,
      api,
      idRequestParser,
      csrfCheck,
      csrfAddToken,
      returnUrlVerifier,
      newsletterService,
      signinService,
      profileFormsMapping,
      testApplicationContext,
      httpConfiguration,
      controllerComponent
    )
  }

  "EditProfileController" when {
    "The submitAccountForm method" should {
      object FakeRequestAccountData {
        val primaryEmailAddress = "john.smith@bobmail.com"
        val testTitle = "Mr"
        val firstName = "John"
        val secondName = "Smith"
        val address1 = "10 Downing Street"
        val address2 = "London"
        val address3 = ""
        val address4 = ""
        val postcode = "N1 9GU "
        val country = Countries.UK
        val billingAddress1 = "Buckingham Palace"
        val billingAddress2 = "London"
        val billingAddress3 = ""
        val billingAddress4 = ""
        val billingPostcode = "SW1A 1AA"
        val billingCountry = Countries.UK
        val telephoneNumberCountryCode = "44"
        val telephoneNumberLocalNumber = "2033532000"
      }

      import FakeRequestAccountData._

      def createFakeRequestWithoutBillingAddress: FakeRequest[AnyContentAsFormUrlEncoded] = {

        import FakeRequestAccountData._

        FakeCSRFRequest(csrfAddToken)
          .withFormUrlEncodedBody(
            ("primaryEmailAddress", primaryEmailAddress),
            ("title", testTitle),
            ("firstName", firstName),
            ("secondName", secondName),
            ("address.line1", address1),
            ("address.line2", address2),
            ("address.line3", address3),
            ("address.line4", address4),
            ("address.postcode", postcode),
            ("address.country", country),
            ("telephoneNumber.countryCode", telephoneNumberCountryCode),
            ("telephoneNumber.localNumber", telephoneNumberLocalNumber)
          )

      }

      def createFakeRequestWithoutTelephoneNumber: FakeRequest[AnyContentAsFormUrlEncoded] = {

        import FakeRequestAccountData._

        FakeCSRFRequest(csrfAddToken)
          .withFormUrlEncodedBody(
            ("primaryEmailAddress", primaryEmailAddress),
            ("title", testTitle),
            ("firstName", firstName),
            ("secondName", secondName),
            ("address.line1", address1),
            ("address.line2", address2),
            ("address.line3", address3),
            ("address.line4", address4),
            ("address.postcode", postcode),
            ("address.country", country)
          )

      }

      def createFakeRequestDeleteTelephoneNumber: FakeRequest[AnyContentAsFormUrlEncoded] = {

        import FakeRequestAccountData._

        FakeCSRFRequest(csrfAddToken)
          .withFormUrlEncodedBody(
            ("primaryEmailAddress", primaryEmailAddress),
            ("title", testTitle),
            ("firstName", firstName),
            ("secondName", secondName),
            ("address.line1", address1),
            ("address.line2", address2),
            ("address.line3", address3),
            ("address.line4", address4),
            ("address.postcode", postcode),
            ("address.country", country),
            ("deleteTelephoneNumber", "true")
          )
      }


      def createFakeRequestWithBillingAddress: FakeRequest[AnyContentAsFormUrlEncoded] = {

        import FakeRequestAccountData._

        FakeCSRFRequest(csrfAddToken)
          .withFormUrlEncodedBody(
            ("primaryEmailAddress", primaryEmailAddress),
            ("title", testTitle),
            ("firstName", firstName),
            ("secondName", secondName),
            ("address.line1", address1),
            ("address.line2", address2),
            ("address.line3", address3),
            ("address.line4", address4),
            ("address.postcode", postcode),
            ("address.country", country),
            ("billingAddress.line1", billingAddress1),
            ("billingAddress.line2", billingAddress2),
            ("billingAddress.line3", billingAddress3),
            ("billingAddress.line4", billingAddress4),
            ("billingAddress.postcode", billingPostcode),
            ("billingAddress.country", billingCountry),
            ("telephoneNumber.countryCode", telephoneNumberCountryCode),
            ("telephoneNumber.localNumber", telephoneNumberLocalNumber)
          )

      }

      "return 200 if called with a valid CSRF request" in new EditProfileFixture {
        val fakeRequest = createFakeRequestWithBillingAddress

        when(api.saveUser(MockitoMatchers.any[String], MockitoMatchers.any[UserUpdateDTO], MockitoMatchers.any[Auth]))
          .thenReturn(Future.successful(Right(user)))

        val result = controller.submitAccountForm().apply(fakeRequest)
        status(result) should be(200)
      }

      "save the user with the ID API without billing address request" in new EditProfileFixture {
        val fakeRequest = createFakeRequestWithoutBillingAddress

        val updatedUser = user.copy(
          primaryEmailAddress = primaryEmailAddress,
          privateFields = PrivateFields(
            title = Some(testTitle),
            firstName = Some(firstName),
            secondName = Some(secondName),
            address1 = Some(address1),
            address2 = Some(address2),
            address3 = Some(address3),
            address4 = Some(address4),
            postcode = Some(postcode),
            country = Some(country),
            telephoneNumber = Some(TelephoneNumber(Some(telephoneNumberCountryCode), Some(telephoneNumberLocalNumber)))
          )
        )

        when(api.saveUser(MockitoMatchers.any[String], MockitoMatchers.any[UserUpdateDTO], MockitoMatchers.any[Auth]))
          .thenReturn(Future.successful(Right(updatedUser)))

        val result = controller.submitAccountForm().apply(fakeRequest)
        status(result) should be(200)
        val userUpdateCapture = ArgumentCaptor.forClass(classOf[UserUpdateDTO])
        verify(api).saveUser(MockitoMatchers.eq(userId), userUpdateCapture.capture(), MockitoMatchers.eq(testAuth))
        val userUpdate = userUpdateCapture.getValue

        userUpdate.primaryEmailAddress.value should equal(primaryEmailAddress)
        userUpdate.privateFields.value.firstName.value should equal(firstName)
        userUpdate.privateFields.value.secondName.value should equal(secondName)
        userUpdate.privateFields.value.address1.value should equal(address1)
        userUpdate.privateFields.value.address2.value should equal(address2)
        userUpdate.privateFields.value.address3 should equal(None)
        userUpdate.privateFields.value.address4 should equal(None)
        userUpdate.privateFields.value.postcode.value should equal(postcode)
        userUpdate.privateFields.value.country.value should equal(country)
        userUpdate.privateFields.value.telephoneNumber.value should equal(TelephoneNumber(Some(telephoneNumberCountryCode), Some(telephoneNumberLocalNumber)))
      }

      "delete a telephone number with a delete telephone number request" in new EditProfileFixture {
        val fakeRequest = createFakeRequestDeleteTelephoneNumber

        when(api.deleteTelephone(MockitoMatchers.any[Auth]))
          .thenReturn(Future.successful(Right(())))

        val result = controller.submitAccountForm().apply(fakeRequest)
        status(result) should be(200)

        verify(api).deleteTelephone(MockitoMatchers.eq(testAuth))
      }

      "save the user on the ID API without telephone number request" in new EditProfileFixture {
        val fakeRequest = createFakeRequestWithoutTelephoneNumber

        val updatedUser = user.copy(
          primaryEmailAddress = primaryEmailAddress,
          privateFields = PrivateFields(
            title = Some(testTitle),
            firstName = Some(firstName),
            secondName = Some(secondName),
            address1 = Some(address1),
            address2 = Some(address2),
            address3 = Some(address3),
            address4 = Some(address4),
            postcode = Some(postcode),
            country = Some(country)
          )
        )

        when(api.saveUser(MockitoMatchers.any[String], MockitoMatchers.any[UserUpdateDTO], MockitoMatchers.any[Auth]))
          .thenReturn(Future.successful(Right(updatedUser)))

        val result = controller.submitAccountForm().apply(fakeRequest)
        status(result) should be(200)

        val userUpdateCapture = ArgumentCaptor.forClass(classOf[UserUpdateDTO])
        verify(api).saveUser(MockitoMatchers.eq(userId), userUpdateCapture.capture(), MockitoMatchers.eq(testAuth))
        val userUpdate = userUpdateCapture.getValue

        userUpdate.primaryEmailAddress.value should equal(primaryEmailAddress)
        userUpdate.privateFields.value.title.value should equal(testTitle)
        userUpdate.privateFields.value.firstName.value should equal(firstName)
        userUpdate.privateFields.value.secondName.value should equal(secondName)
        userUpdate.privateFields.value.address1.value should equal(address1)
        userUpdate.privateFields.value.address2.value should equal(address2)
        userUpdate.privateFields.value.address3 should equal(None)
        userUpdate.privateFields.value.address4 should equal(None)
        userUpdate.privateFields.value.postcode.value should equal(postcode)
        userUpdate.privateFields.value.country.value should equal(country)
      }

      "save the user on the ID API with billing address" in new EditProfileFixture {
        val fakeRequest = createFakeRequestWithBillingAddress

        val updatedUser = user.copy(
          primaryEmailAddress = primaryEmailAddress,
          privateFields = PrivateFields(
            title = Some(testTitle),
            firstName = Some(firstName),
            secondName = Some(secondName),
            address1 = Some(address1),
            address2 = Some(address2),
            address3 = Some(address3),
            address4 = Some(address4),
            postcode = Some(postcode),
            country = Some(country),
            billingAddress1 = Some(billingAddress1),
            billingAddress2 = Some(billingAddress2),
            billingAddress3 = Some(billingAddress3),
            billingAddress4 = Some(billingAddress4),
            billingPostcode = Some(billingPostcode),
            billingCountry = Some(billingCountry),
            telephoneNumber = Some(TelephoneNumber(Some(telephoneNumberCountryCode), Some(telephoneNumberLocalNumber)))
          )
        )

        when(api.saveUser(MockitoMatchers.any[String], MockitoMatchers.any[UserUpdateDTO], MockitoMatchers.any[Auth]))
          .thenReturn(Future.successful(Right(updatedUser)))

        val result = controller.submitAccountForm().apply(fakeRequest)
        status(result) should be(200)

        val userUpdateCapture = ArgumentCaptor.forClass(classOf[UserUpdateDTO])
        verify(api).saveUser(MockitoMatchers.eq(userId), userUpdateCapture.capture(), MockitoMatchers.eq(testAuth))
        val userUpdate = userUpdateCapture.getValue

        userUpdate.primaryEmailAddress.value should equal(primaryEmailAddress)
        userUpdate.privateFields.value.title.value should equal(testTitle)
        userUpdate.privateFields.value.firstName.value should equal(firstName)
        userUpdate.privateFields.value.secondName.value should equal(secondName)
        userUpdate.privateFields.value.address1.value should equal(address1)
        userUpdate.privateFields.value.address2.value should equal(address2)
        userUpdate.privateFields.value.address3 should equal(None)
        userUpdate.privateFields.value.address4 should equal(None)
        userUpdate.privateFields.value.postcode.value should equal(postcode)
        userUpdate.privateFields.value.country.value should equal(country)
        userUpdate.privateFields.value.billingAddress1.value should equal(billingAddress1)
        userUpdate.privateFields.value.billingAddress2.value should equal(billingAddress2)
        userUpdate.privateFields.value.billingAddress3 should equal(None)
        userUpdate.privateFields.value.billingAddress4 should equal(None)
        userUpdate.privateFields.value.billingPostcode.value should equal(billingPostcode)
        userUpdate.privateFields.value.billingCountry.value should equal(billingCountry)
        userUpdate.privateFields.value.telephoneNumber.value should equal(TelephoneNumber(Some(telephoneNumberCountryCode), Some(telephoneNumberLocalNumber)))
      }
    }
  }
}

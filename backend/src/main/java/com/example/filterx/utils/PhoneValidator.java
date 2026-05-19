package com.example.filterx.utils;

import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber;
import com.google.i18n.phonenumbers.NumberParseException;

public class PhoneValidator {
    private static final PhoneNumberUtil phoneUtil = PhoneNumberUtil.getInstance();

    public static String validateAndFormat(String phoneNumber, String region) {
        try {
            Phonenumber.PhoneNumber numberProto = phoneUtil.parse(phoneNumber, region);

            if (!phoneUtil.isValidNumber(numberProto)) {
                throw new IllegalArgumentException("Invalid phone number");
            }

            // Convert to international format (+959...)
            return phoneUtil.format(numberProto, PhoneNumberUtil.PhoneNumberFormat.E164);

        } catch (NumberParseException e) {
            throw new IllegalArgumentException("Invalid phone number format");
        }
    }
}


import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';

export const NotFoundPage = () => {
  return (
    <>
      <Header />
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16 text-center bg-amber-50">
        <h1 className="text-9xl font-bold text-amber-200">404</h1>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-amber-900 sm:text-4xl font-serif">
          Page not found
        </h2>
        <p className="mt-4 text-lg text-amber-800">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-sm border border-transparent bg-amber-800 px-5 py-3 text-base font-medium text-amber-50 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors font-serif uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(69,26,3,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(69,26,3,1)]"
          >
            Go back home
          </Link>
        </div>
      </div>
    </>
  );
};


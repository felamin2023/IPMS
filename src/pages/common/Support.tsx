export default function Support() {
  return (
    <div className="bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Support
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            FAQs, quick instructions, and contact support.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Quick FAQs</h2>
            <div className="mt-3 space-y-3 text-sm text-gray-600">
              <p>
                <span className="font-semibold text-gray-800">
                  How do I submit a request?
                </span>{" "}
                Create or update your PPMP first, then submit a procurement
                request with items from your PPMP list.
              </p>
              <p>
                <span className="font-semibold text-gray-800">
                  Why can’t I submit my request?
                </span>{" "}
                Check if your PPMP is active and not expired, and ensure all
                items are selected from your PPMP.
              </p>
              <p>
                <span className="font-semibold text-gray-800">
                  Where can I track status updates?
                </span>{" "}
                Use the Monitoring page to see real-time progress and chat
                updates.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">
              How to Use IPMS
            </h2>
            <ol className="mt-3 space-y-2 text-sm text-gray-600 list-decimal list-inside">
              <li>Go to PPMP and add your planned items for the year.</li>
              <li>Submit a procurement request with PPMP-approved items.</li>
              <li>Monitor updates and reply in Communication History.</li>
              <li>Download the PR once it is reviewed and validated.</li>
            </ol>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Contact</h2>
            <div className="mt-3 text-sm text-gray-600">
              <p>Email: ipms.support@ctu.edu.ph</p>
              <p>Phone: (032) 401-0737 local 1700</p>
              <p>Office: Procurement Office, CTU Argao Campus</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
